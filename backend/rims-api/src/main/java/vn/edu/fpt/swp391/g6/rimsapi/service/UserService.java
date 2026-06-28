package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.auth.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.user.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;

import java.util.List;


public interface UserService
{

    List<UserResponse> getAllUsers();

    UserProfileResponse getProfile(Integer id);

    UserProfileResponse updateProfile(Integer id, UpdateProfileRequest request);

    List<UserResponse> getStaffAccounts();

    List<UserResponse> getCustomerAccounts();

    UserResponse createCustomer(CreateCustomerRequest request);

    UserResponse createStaff(CreateStaffRequest request);

    UserResponse getAccountDetail(Integer id);

    UserResponse updateAccount(Integer id, UpdateAccountRequest request);

    void setAccountStatus(Integer id, SetAccountStatusRequest request);

    void changePassword(UserPrincipal principal, ChangePasswordRequest request);

    void sendForgotPasswordOtp(ForgotPasswordRequest request);

    void verifyOtpAndResetPassword(VerifyOtpRequest request);
}
