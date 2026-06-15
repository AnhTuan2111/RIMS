package vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationRequest
{
    @NotBlank
    private String username;

    @NotBlank
    private String rawPassword;
}
