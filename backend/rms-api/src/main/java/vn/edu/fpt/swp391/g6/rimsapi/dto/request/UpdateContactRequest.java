package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContactRequest
{
    @NotBlank
    private String address;

    @NotBlank
    private String phone;

    @Email
    private String email;

    @NotBlank
    private String openingHours;

    private String mapUrl;
}
