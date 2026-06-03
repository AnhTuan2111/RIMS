package com.anhtuan.miniproject.rmsapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class LoginRequest
{
    @NotBlank
    private String username;

    @NotBlank
    private String rawPassword;
}
