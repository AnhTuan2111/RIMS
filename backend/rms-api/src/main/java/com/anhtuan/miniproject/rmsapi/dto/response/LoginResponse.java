package com.anhtuan.miniproject.rmsapi.dto.response;

import com.anhtuan.miniproject.rmsapi.enums.RoleType;
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