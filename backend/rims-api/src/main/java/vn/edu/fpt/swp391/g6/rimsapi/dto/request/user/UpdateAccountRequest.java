package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    @NotBlank()
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank()
    @Pattern(regexp = "^\\p{L}+( \\p{L}+)*$")
    private String fullName;

    @Email()
    @Size(max = 100)
    private String email;

    @NotBlank()
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    private RoleType role;
}