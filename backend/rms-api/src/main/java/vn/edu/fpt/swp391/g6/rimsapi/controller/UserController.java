package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.UserResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController
{
    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers()
    {
        return userService.getAllUsers();
    }
}