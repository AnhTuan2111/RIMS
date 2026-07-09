package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomerRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải có từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Họ tên không được để trống")
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$", message = "Họ tên không hợp lệ")
    @Size(min = 5, max = 50, message = "Họ và tên phải có từ 5-50 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|fpt\\.edu\\.vn)$",
            message = "Email phải thuộc domain @gmail.com hoặc @fpt.edu.vn"
    )
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự!")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^0[0-9]{9}$",
            message = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số"
    )
    private String phone;

    @Size(min = 6, message = "Mật khẩu từ 6 ký tự trở lên")
    private String password;
}
