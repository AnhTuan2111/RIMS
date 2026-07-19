package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomerRequest {

    @NotBlank()
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank()
    @Pattern(regexp = "^\\p{L}+( \\p{L}+)*$")
    @Size(min = 3, max = 50)
    private String fullName;

    @Email()
    @Size(max = 50)
    private String email;

    @NotBlank()
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;
}
