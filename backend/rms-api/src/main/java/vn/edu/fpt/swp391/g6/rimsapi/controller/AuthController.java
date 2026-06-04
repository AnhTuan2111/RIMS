package vn.edu.fpt.swp391.g6.rimsapi.controller;


import vn.edu.fpt.swp391.g6.rimsapi.dto.request.LoginRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LoginResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.AuthService;
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
