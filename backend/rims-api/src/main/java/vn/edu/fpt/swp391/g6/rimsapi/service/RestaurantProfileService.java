package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.restaurant.UpdateRestaurantProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.restaurant.RestaurantProfileResponse;

public interface RestaurantProfileService
{
    /** Đọc thông tin nhà hàng. Tự tạo bản mặc định nếu chưa cấu hình lần nào. */
    RestaurantProfileResponse getProfile();

    RestaurantProfileResponse updateProfile(UpdateRestaurantProfileRequest request);
}
