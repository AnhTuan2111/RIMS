package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.AuthenticationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.RefreshTokenRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.AuthenticationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LogoutResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;

public interface AuthService
{
    AuthenticationResponse login(AuthenticationRequest loginRequest);

    AuthenticationResponse refresh(RefreshTokenRequest request);

    UserProfileResponse getCurrentUser(UserPrincipal principal);

    LogoutResponse logout();
}
