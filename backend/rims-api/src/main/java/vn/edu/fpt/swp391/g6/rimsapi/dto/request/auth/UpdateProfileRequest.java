package vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải có từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Họ tên không được để trống")
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$", message = "Họ tên không hợp lệ")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự!")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(message = "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số",
            regexp = "^0[0-9]{9}$")
    private String phone;
}