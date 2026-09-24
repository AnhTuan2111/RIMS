package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
 * cho vai trò CUSTOMER đi qua — kể cả Quản trị viên cũng bị chặn. Màn Hồ sơ lách
 * bằng cách cho nhân viên gọi endpoint của Quản trị, thứ mà Bếp, Phục vụ và Thu
 * ngân cũng không có quyền gọi, nên nút Lưu của họ chưa bao giờ chạy.
 *
 * <p>{@code principal} luôn là chính người gọi, nên không ai đọc hay sửa được
 * hồ sơ của người khác.
 *
 * <p>Quyền theo SRS:
 * <ul>
 *   <li>UC-PR-01 Xem hồ sơ — mọi vai trò;</li>
 *   <li>UC-PR-02 Sửa hồ sơ — Quản trị viên và Khách hàng;</li>
 *   <li>UC-AU-04 Đổi mật khẩu — Quản trị viên và Khách hàng. Nhân viên đổi mật
 *       khẩu thì nhờ Quản trị viên đặt lại, xem {@code AdminController}.</li>
 * </ul>
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
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public UserResponse updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateAccountRequest request)
    {
        return userService.updateAccount(principal.getId(), request);
    }

    /**
     * Đổi mật khẩu của chính mình.
     *
     * <p>Trước đây chỉ Quản trị viên và Khách hàng gọi được, theo SRS thì
     * nhân viên muốn đổi phải nhờ Quản trị viên đặt lại. Nhưng đặt lại chỉ đưa
     * mật khẩu về đúng chuỗi mặc định, nên Bếp, Phục vụ và Thu ngân không có
     * cách nào thoát khỏi mật khẩu mặc định — và cũng không thể bắt họ đổi.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request)
    {
        userService.changePassword(principal, request);

        return ResponseEntity.noContent().build();
    }
}
