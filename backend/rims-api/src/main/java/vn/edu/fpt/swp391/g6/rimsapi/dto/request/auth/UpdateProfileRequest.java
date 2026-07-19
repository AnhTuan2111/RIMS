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

    @NotBlank()
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank()
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^\\p{L}+( \\p{L}+)*$")
    private String fullName;

    @NotBlank()
    @Email()
    @Size(max = 50)
    private String email;

    @NotBlank()
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;
}