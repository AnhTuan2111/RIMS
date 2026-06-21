package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateProfileRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserProfileResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ================= VIEW LIST ACCOUNT (Staff) =================

    @Override
    public List<UserResponse> getStaffAccounts() {
        List<RoleType> staffRoles = List.of(
                RoleType.ADMIN, RoleType.CHEF, RoleType.WAITER, RoleType.CASHIER);

        return userRepository.findByRoleIn(staffRoles)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ================= VIEW PROFILE =================
    @Override
    public UserProfileResponse getProfile(Integer id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return toProfileResponse(user);
    }

    // ================= UPDATE PROFILE =================
    @Override
    public UserProfileResponse updateProfile(
            Integer id,
            UpdateProfileRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (request.getPhone() != null
                && !request.getPhone().equals(user.getPhone())) {

            if (userRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("Phone already in use");
            }

            user.setPhone(request.getPhone());
        }

        if (request.getEmail() != null
                && !request.getEmail().equals(user.getEmail())) {

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }

            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        return toProfileResponse(saved);
    }

    // ================= helpers =================

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }

    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
