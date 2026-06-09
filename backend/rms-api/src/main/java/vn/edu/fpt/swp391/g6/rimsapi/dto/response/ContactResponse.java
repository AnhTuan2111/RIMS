package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse
{
    private String address;
    private String phone;
    private String email;
    private String openingHours;
    private String mapUrl;
}
