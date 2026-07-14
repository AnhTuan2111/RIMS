package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.AuthenticationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.RefreshTokenRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.auth.AuthenticationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.auth.LogoutResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RevokedToken;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.exception.InvalidTokenException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RevokedTokenRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.service.AuthService;
import vn.edu.fpt.swp391.g6.rimsapi.service.JwtService;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService
{
    private static final long ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RevokedTokenRepository revokedTokenRepository;

    @Override
    public AuthenticationResponse login(AuthenticationRequest loginRequest)
    {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.isActive())
        {
            throw new DisabledException("Account is disabled");
        }

        if (!passwordEncoder.matches(loginRequest.getRawPassword(), user.getPasswordHash()))
        {
            throw new BadCredentialsException("Invalid username or password");
        }

        return buildAuthenticationResponse(user);
    }

    @Override
    public AuthenticationResponse refresh(RefreshTokenRequest request)
    {
        JWTClaimsSet claims = jwtService.parseAndValidate(request.getRefreshToken());

        if (!jwtService.isRefreshToken(claims))
        {
            throw new InvalidTokenException("Invalid refresh token");
        }

        Integer userId = jwtService.extractUserId(claims);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        if (!user.isActive())
        {
            throw new DisabledException("Account is disabled");
        }

        return buildAuthenticationResponse(user);
    }

    @Override
    public UserProfileResponse getCurrentUser(UserPrincipal principal)
    {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return toUserProfile(user);
    }

    @Override
    public LogoutResponse logout(UserPrincipal principal, String rawAccessToken)
    {
        String jti = jwtService.extractJti(rawAccessToken);
        java.time.LocalDateTime exp = jwtService.extractExpiry(rawAccessToken);
        if (jti != null && exp != null)
        {
            revokedTokenRepository.save(new RevokedToken(jti, LocalDateTime.now(), exp));
        }

        return LogoutResponse.builder()
                .message("Logged out successfully")
                .build();
    }

    private AuthenticationResponse buildAuthenticationResponse(User user)
    {
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name()
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(ACCESS_TOKEN_EXPIRES_IN_SECONDS)
                .authenticated(true)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private UserProfileResponse toUserProfile(User user)
    {
        return UserProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void cleanupRevokedTokens()
    {
        revokedTokenRepository.deleteAllByExpiresAtBefore(LocalDateTime.now());
    }
}
