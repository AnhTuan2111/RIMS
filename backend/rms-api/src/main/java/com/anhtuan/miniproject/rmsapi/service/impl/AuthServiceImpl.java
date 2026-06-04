package com.anhtuan.miniproject.rmsapi.service.impl;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.anhtuan.miniproject.rmsapi.dto.request.LoginRequest;
import com.anhtuan.miniproject.rmsapi.dto.response.LoginResponse;
import com.anhtuan.miniproject.rmsapi.entity.User;
import com.anhtuan.miniproject.rmsapi.mapper.AuthMapper;
import com.anhtuan.miniproject.rmsapi.repository.UserRepository;
import com.anhtuan.miniproject.rmsapi.service.AuthService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService
{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;

    @Override
    public LoginResponse login(LoginRequest loginRequest)
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
}
