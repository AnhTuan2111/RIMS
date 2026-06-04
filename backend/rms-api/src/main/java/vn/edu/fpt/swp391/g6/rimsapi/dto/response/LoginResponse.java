package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import lombok.*;


@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse
{
    private Integer userId;

    private String fullName;

    private String phone;

    private String email;

    private RoleType role;
}