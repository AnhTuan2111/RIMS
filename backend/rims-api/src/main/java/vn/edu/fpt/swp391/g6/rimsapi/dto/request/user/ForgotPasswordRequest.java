package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @Email
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|fpt\\.edu\\.vn)$")
    private String email;
}
