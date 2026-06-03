package com.anhtuan.miniproject.rmsapi.dto.response;

import com.anhtuan.miniproject.rmsapi.enums.RoleType;
import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
public class LoginResponse
{
    private Integer userId;

    private String fullName;

    private String phone;

    private String email;

    private RoleType role;
}