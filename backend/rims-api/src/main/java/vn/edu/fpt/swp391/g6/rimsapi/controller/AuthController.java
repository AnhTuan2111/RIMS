package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.AuthenticationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.RefreshTokenRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.ForgotPasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.VerifyOtpRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.auth.AuthenticationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.auth.LogoutResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.service.AuthService;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;


@RestController
@RequestMapping("/rims/auth")
@RequiredArgsConstructor
public class AuthController
{

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public AuthenticationResponse login(@Valid @RequestBody AuthenticationRequest loginRequest)
    {
        return authService.login(loginRequest);
    }

    @PostMapping("/refresh")
    public AuthenticationResponse refresh(@Valid @RequestBody RefreshTokenRequest request)
    {
        return authService.refresh(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal UserPrincipal principal)
    {
        return authService.getCurrentUser(principal);
    }

    @PostMapping("/logout")
    public LogoutResponse logout()
    {
        return authService.logout();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request)
    {
        userService.sendForgotPasswordOtp(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid VerifyOtpRequest request)
    {
        userService.verifyOtpAndResetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
