package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.ChangePasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateCustomerAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateStaffAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.SetAccountStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.AccountDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }


    @GetMapping("/profile/{id}")
    public UserProfileResponse getProfile(
            @PathVariable Integer id) {

        return userService.getProfile(id);
    }

    @PutMapping("/profile/update/{id}")
    public UserProfileResponse updateProfile(
            @PathVariable Integer id,
            @RequestBody UpdateProfileRequest request) {

        return userService.updateProfile(id, request);
    }


    // ================= VIEW LIST ACCOUNT (2 tab: Staff / Customer) =================
    @GetMapping("/staff")
    public List<UserResponse> getStaffAccounts() {
        return userService.getStaffAccounts();
    }

}    @GetMapping("/customers")
    public List<UserResponse> getCustomerAccounts() {
        return userService.getCustomerAccounts();
    }

