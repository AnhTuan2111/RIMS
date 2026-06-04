package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.LoginRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LoginResponse;


public interface AuthService
{
    LoginResponse login(LoginRequest loginRequest);
}