package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.restaurant.UpdateRestaurantProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.restaurant.RestaurantProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantProfile;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantProfileRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.RestaurantProfileService;
import vn.edu.fpt.swp391.g6.rimsapi.util.ReservationWindow;

@Service
@RequiredArgsConstructor
public class RestaurantProfileServiceImpl implements RestaurantProfileService
{

    private final RestaurantProfileRepository restaurantProfileRepository;

    private final ReservationWindow reservationWindow;

    @Override
    @Transactional
    public RestaurantProfileResponse getProfile()
    {
        return toResponse(loadOrCreate());
    }

    @Override
    @Transactional
    public RestaurantProfileResponse updateProfile(UpdateRestaurantProfileRequest request)
    {
        RestaurantProfile profile = loadOrCreate();

        profile.setName(request.getName().trim());
        profile.setTagline(trimToNull(request.getTagline()));
        profile.setDescription(trimToNull(request.getDescription()));
        profile.setLogoUrl(trimToNull(request.getLogoUrl()));
        profile.setHeroImageUrl(trimToNull(request.getHeroImageUrl()));
        profile.setAddress(trimToNull(request.getAddress()));
        profile.setPhone(trimToNull(request.getPhone()));
        profile.setEmail(trimToNull(request.getEmail()));
        profile.setOpeningHours(trimToNull(request.getOpeningHours()));

        return toResponse(restaurantProfileRepository.save(profile));
    }

    /**
     * Bảng này luôn chỉ có một dòng. Lần đầu chạy chưa có gì thì tạo bản mặc định
     * trung tính, không gắn với nền ẩm thực nào — chủ nhà hàng vào màn Cấu hình
     * điền lại theo quán của mình.
     */
    private RestaurantProfile loadOrCreate()
    {
        return restaurantProfileRepository.findAll().stream().findFirst().orElseGet(() -> {
            RestaurantProfile profile = new RestaurantProfile();

            profile.setName("Nhà hàng của bạn");
            profile.setTagline("Hãy vào mục Cấu hình nhà hàng để đổi thông tin này");

            // Lấy từ chính khung giờ nhận đặt bàn. Giá trị cũ gõ tay là
            // "10:00 - 22:00" trong khi hệ thống chỉ nhận đặt 08:00 - 20:00,
            // nên trang công khai nói một đằng còn form đặt bàn từ chối một nẻo.
            profile.setOpeningHours(reservationWindow.describe() + " hằng ngày");

            return restaurantProfileRepository.save(profile);
        });
    }

    private String trimToNull(String value)
    {
        if (value == null)
        {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private RestaurantProfileResponse toResponse(RestaurantProfile profile)
    {
        return RestaurantProfileResponse.builder()
                .name(profile.getName())
                .tagline(profile.getTagline())
                .description(profile.getDescription())
                .logoUrl(profile.getLogoUrl())
                .heroImageUrl(profile.getHeroImageUrl())
                .address(profile.getAddress())
                .phone(profile.getPhone())
                .email(profile.getEmail())
                .openingHours(profile.getOpeningHours())
                .reservationHours(reservationWindow.describe())
                .build();
    }
}
