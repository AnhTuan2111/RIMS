package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

import java.util.List;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController
{
    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers()
    {
        return userService.getAllUsers();
    }

    @GetMapping("/profile/{username}")
    public UserProfileResponse getProfile(
            @PathVariable String username) {

        return userService.getProfile(username);
    }

    @PutMapping("/profile/{username}")
    public UserProfileResponse updateProfile(
            @PathVariable String username,
            @Valid @RequestBody UpdateProfileRequest request) {

        return userService.updateProfile(username, request);
    }

}