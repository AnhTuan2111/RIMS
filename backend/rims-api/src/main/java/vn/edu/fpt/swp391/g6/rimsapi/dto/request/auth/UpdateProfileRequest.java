package vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    private String fullName;

    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|fpt\\.edu\\.vn)$")
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

}

