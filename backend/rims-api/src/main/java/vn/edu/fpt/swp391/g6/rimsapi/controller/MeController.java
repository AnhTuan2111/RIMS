package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.ChangePasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.UpdateAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

/**
 * Hồ sơ của chính người đang đăng nhập, không phân biệt vai trò.
 *
 * <p>Ba thao tác này vốn nằm dưới {@code /rims/customer/**}, mà nhánh đó chỉ
 * cho vai trò CUSTOMER đi qua. Hậu quả: bốn vai trò còn lại KHÔNG đổi được mật
 * khẩu của chính mình, và màn Hồ sơ phải lách bằng cách gọi endpoint của Quản
 * trị — thứ mà Bếp, Phục vụ và Thu ngân lại không có quyền gọi.
 *
 * <p>Không khai báo vai trò nào ở đây: SecurityConfig đã bắt mọi đường dẫn chưa
 * liệt kê phải đăng nhập, và {@code principal} luôn là chính người gọi nên
 * không ai đọc hay sửa được hồ sơ của người khác.
 */
@RestController
@RequestMapping("/rims/me")
@RequiredArgsConstructor
public class MeController
{

    private final UserService userService;

    @GetMapping("/profile")
    public UserResponse getMyProfile(@AuthenticationPrincipal UserPrincipal principal)
    {
        return userService.getAccountDetail(principal.getId());
    }

    @PutMapping("/profile")
    public UserResponse updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateAccountRequest request)
    {
        return userService.updateAccount(principal.getId(), request);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request)
    {
        userService.changePassword(principal, request);

        return ResponseEntity.noContent().build();
    }
}
