package com.anhtuan.miniproject.rmsapi.service;

import com.anhtuan.miniproject.rmsapi.dto.request.LoginRequest;
import com.anhtuan.miniproject.rmsapi.dto.response.LoginResponse;


public interface AuthService
{
    LoginResponse login(LoginRequest loginRequest);
}