package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.AuthenticationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.AuthenticationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LogoutResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.mapper.AuthMapper;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.AuthService;
import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService
{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;

    @Value("${jwt.signerKey}")
    @NonFinal
    protected String SIGNER_KEY;

    @Override
    public AuthenticationResponse login(AuthenticationRequest loginRequest)
    {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(
                        () -> new BadCredentialsException("Invalid username or password")
                );

        if (!user.isActive())
        {
            throw new DisabledException("Account is disabled");
        }

        if (!passwordEncoder.matches(loginRequest.getRawPassword(), user.getPasswordHash()))
        {
            throw new BadCredentialsException("Invalid username or password");
        }

        return authMapper.toLoginResponse(user);
    }

    @Override
    public LogoutResponse logout()
    {
        return LogoutResponse.builder()
                .message("Logged out successfully")
                .build();
    }

    public String generateToken(String username)
    {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer("tuannahe200426")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(1, ChronoUnit.DAYS).toEpochMilli()
                ))
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try
        {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e)
        {
            throw new RuntimeException(e);
        }
    }
}
