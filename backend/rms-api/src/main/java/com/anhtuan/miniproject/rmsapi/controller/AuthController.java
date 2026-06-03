package com.anhtuan.miniproject.rmsapi.controller;


import com.anhtuan.miniproject.rmsapi.dto.request.LoginRequest;
import com.anhtuan.miniproject.rmsapi.dto.response.LoginResponse;
import com.anhtuan.miniproject.rmsapi.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController
{
    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest loginRequest)
    {
        return authService.login(loginRequest);
    }

}
