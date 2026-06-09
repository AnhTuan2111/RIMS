package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;

import java.util.List;

public interface UserService
{
    List<UserResponse> getAllUsers();
}