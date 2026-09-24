package vn.edu.fpt.swp391.g6.rimsapi.dto.request.restaurant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRestaurantProfileRequest
{

    @NotBlank(message = "Tên nhà hàng không được để trống")
    @Size(max = 120, message = "Tên nhà hàng tối đa 120 ký tự")
    private String name;

    @Size(max = 200, message = "Khẩu hiệu tối đa 200 ký tự")
    private String tagline;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @Size(max = 500, message = "Đường dẫn logo tối đa 500 ký tự")
    private String logoUrl;

    @Size(max = 500, message = "Đường dẫn ảnh bìa tối đa 500 ký tự")
    private String heroImageUrl;

    @Size(max = 200, message = "Địa chỉ tối đa 200 ký tự")
    private String address;

    @Pattern(regexp = "^$|^0[0-9]{9}$", message = "Số điện thoại phải bắt đầu bằng 0 và đủ 10 số")
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 120, message = "Email tối đa 120 ký tự")
    private String email;

    @Size(max = 120, message = "Giờ mở cửa tối đa 120 ký tự")
    private String openingHours;
}
