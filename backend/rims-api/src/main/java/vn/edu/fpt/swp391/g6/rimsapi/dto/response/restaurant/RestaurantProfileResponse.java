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
    /** Giờ mở cửa do chủ quán tự điền, dạng chữ tự do. */
    private String openingHours;

    /**
     * Khung giờ hệ thống thực sự nhận đặt bàn, ví dụ "08:00 - 20:00".
     *
     * <p>Tách khỏi {@code openingHours} vì hai thứ này khác nhau: quán có thể mở
     * tới 22:30 nhưng chỉ nhận đặt bàn tới 20:00. Trước đây trang công khai chỉ
     * hiện giờ mở cửa, nên khách chọn 21:00 rồi mới bị form từ chối.
     */
    private String reservationHours;
}
