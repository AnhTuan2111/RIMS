package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import jakarta.validation.constraints.Email;
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
public class UpdateAccountRequest {

    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    private String fullName;

    @Email
    private String email;

    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    private RoleType role;

    /** optional: if provided, will update password */
    private String rawPassword;
}

