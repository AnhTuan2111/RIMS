package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.restaurant.RestaurantProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.RestaurantProfileService;

/**
 * Thông tin nhận diện nhà hàng cho trang công khai.
 *
 * <p>Không cần đăng nhập: trang chủ và trang đăng nhập đều phải đọc được trước khi
 * người dùng có tài khoản. SecurityConfig đã mở /rims/public/**.
 */
@RestController
@RequestMapping("/rims/public/restaurant")
@RequiredArgsConstructor
public class PublicRestaurantController
{

    private final RestaurantProfileService restaurantProfileService;

    @GetMapping
    public RestaurantProfileResponse getProfile()
    {
        return restaurantProfileService.getProfile();
    }
}
