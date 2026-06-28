package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomerRequest
{

    @NotBlank
    private String username;

    @NotBlank
    @Email
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|fpt\\.edu\\.vn)$")
    private String email;


    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    @NotBlank
    @Size(min = 6)
    private String password;
}
