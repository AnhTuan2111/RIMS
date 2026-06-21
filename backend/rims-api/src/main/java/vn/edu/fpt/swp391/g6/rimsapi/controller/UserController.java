package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    // ================= VIEW LIST ACCOUNT =================

    @GetMapping("/staff")
    public List<UserResponse> getStaffAccounts() {
        return userService.getStaffAccounts();
    }

    // ================= VIEW PROFILE =================
    @GetMapping("/profile/{id}")
    public UserProfileResponse getProfile(
            @PathVariable Integer id) {
        return userService.getProfile(id);
    }

    // ================= UPDATE PROFILE =================
    @PutMapping("/profile/update/{id}")
    public UserProfileResponse updateProfile(
            @PathVariable Integer id,
            @RequestBody UpdateProfileRequest request) {

        return userService.updateProfile(id, request);
    }
}
