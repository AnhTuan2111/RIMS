package vn.edu.fpt.swp391.g6.rimsapi.dto.response.restaurant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Thông tin nhận diện nhà hàng trả về cho cả trang công khai lẫn màn quản trị. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantProfileResponse
{
    private String name;
    private String tagline;
    private String description;
    private String logoUrl;
    private String heroImageUrl;
    private String address;
    private String phone;
    private String email;
    private String openingHours;
}
