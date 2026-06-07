package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.AuthenticationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.AuthenticationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LogoutResponse;


public interface AuthService
{
    AuthenticationResponse login(AuthenticationRequest loginRequest);

    LogoutResponse logout();
}