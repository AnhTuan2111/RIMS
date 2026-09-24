package vn.edu.fpt.swp391.g6.rimsapi.dto.response.user;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse
{
    private Integer id;

    private String username;

    private String fullName;

    private String email;

    private String phone;

    private Integer rewardPoints;

    private RoleType role;

    @JsonProperty("isActive")
    private boolean isActive;
    /**
     * Còn bật thì tài khoản vẫn đang dùng mật khẩu do người khác đặt.
     *
     * <p>Có mặt ở đây để màn Hồ sơ biết được tình trạng sau khi tải lại trang,
     * lúc đó phản hồi đăng nhập đã không còn.
     */
    private boolean mustChangePassword;

    private LocalDateTime createdAt;

    /**
     * Mật khẩu vừa được cấp cho tài khoản này, chỉ có ở phản hồi của lần tạo.
     *
     * <p>Sinh ra để màn Đăng ký không phải viết cứng chuỗi mật khẩu mặc định.
     * Bản cũ in thẳng "123456" trong JSX, nên đổi cấu hình ở backend là frontend
     * nói sai, mà không có gì báo.
     *
     * <p>Mọi phản hồi khác bỏ trống trường này, và {@code NON_NULL} khiến nó
     * biến mất hẳn khỏi JSON chứ không nằm đó dưới dạng {@code null} — danh
     * sách người dùng của Quản trị viên không được phép lộ mật khẩu ai cả.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String initialPassword;
}
