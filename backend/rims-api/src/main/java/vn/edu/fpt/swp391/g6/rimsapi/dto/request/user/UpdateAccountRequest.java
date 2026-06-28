package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountRequest
{

    @NotBlank
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    private String fullName;

    @Email
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|fpt\\.edu\\.vn)$")
    private String email;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    // nullable — chỉ gửi khi update staff, bỏ qua khi update customer
    private RoleType role;
}