package vn.edu.fpt.swp391.g6.rimsapi.dto.response.user;

import java.time.LocalDateTime;

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
}
