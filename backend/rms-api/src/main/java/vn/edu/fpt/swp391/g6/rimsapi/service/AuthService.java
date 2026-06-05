package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.LoginRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LoginResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LogoutResponse;


public interface AuthService
{
    LoginResponse login(LoginRequest loginRequest);

    LogoutResponse logout();
}