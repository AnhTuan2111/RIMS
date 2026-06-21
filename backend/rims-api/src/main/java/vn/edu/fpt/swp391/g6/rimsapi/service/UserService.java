package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserProfileResponse getProfile(Integer id);

    UserProfileResponse updateProfile(Integer id, UpdateProfileRequest request);

    List<UserResponse> getStaffAccounts();
}
