package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeContentData
{
    private String brandName;
    private String tagline;
    private String description;
    private String heroImageUrl;
    private String address;
    private String phone;
    private String email;
    private String openingHours;
    private String mapUrl;
}
