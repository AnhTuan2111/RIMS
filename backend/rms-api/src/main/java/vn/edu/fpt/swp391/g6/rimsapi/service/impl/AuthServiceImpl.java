package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import com.nimbusds.jose.JWSObject;
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


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService
{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;

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

    public String generateToken()
    {
        

        JWSObject jwsObject = new JWSObject();
    }
}
