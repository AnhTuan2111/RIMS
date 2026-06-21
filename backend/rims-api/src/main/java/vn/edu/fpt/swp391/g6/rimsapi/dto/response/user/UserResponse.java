package vn.edu.fpt.swp391.g6.rimsapi.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse
{
    private Integer id;

    private String username;

    private String fullName;

    private String email;

    private String phone;

    private RoleType role;

    private boolean isActive;

    private LocalDateTime createdAt;
}
