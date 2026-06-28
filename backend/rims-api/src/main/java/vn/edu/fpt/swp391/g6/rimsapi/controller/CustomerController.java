package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.ChangePasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.UpdateAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

@RestController
@RequestMapping("/rims/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final UserService userService;

    @GetMapping("/profile")
    public UserResponse getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.getAccountDetail(principal.getId());
    }

    @PutMapping("/profile")
    public UserResponse updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid UpdateAccountRequest request) {
        return userService.updateAccount(principal.getId(), request);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(principal, request);
        return ResponseEntity.noContent().build();
    }
}
