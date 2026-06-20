package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.ChangePasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateCustomerAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateStaffAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateAccountRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.SetAccountStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.AccountDetailResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    // VIEW PROFILE — chỉ trả về username, email, phone, role
    UserProfileResponse getProfile(Integer id);

    UserProfileResponse updateProfile(Integer id, UpdateProfileRequest request);

    // CHANGE PASSWORD — chỉ áp dụng cho role CUSTOMER
    void changePassword(Integer id, ChangePasswordRequest request);

    // CREATE STAFF ACCOUNT (username, email, phone, role, password)
    AccountDetailResponse createStaffAccount(CreateStaffAccountRequest request);

    // CREATE CUSTOMER ACCOUNT (username, email, phone, password)
    AccountDetailResponse createCustomerAccount(CreateCustomerAccountRequest request);

    // VIEW LIST ACCOUNT — chia 2 tab Staff / Customer
    List<UserResponse> getStaffAccounts();

    List<UserResponse> getCustomerAccounts();

    // VIEW ACCOUNT DETAIL — dùng chung cho Staff & Customer
    AccountDetailResponse getAccountById(Integer id);

    // UPDATE ACCOUNT
    AccountDetailResponse updateAccount(Integer id, UpdateAccountRequest request);

    // SET STATUS ACCOUNT (khoá / mở khoá)
    AccountDetailResponse setAccountStatus(Integer id, SetAccountStatusRequest request);
}