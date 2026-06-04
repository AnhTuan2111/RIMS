package com.anhtuan.miniproject.rmsapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest
{
    @NotBlank
    private String username;

    @NotBlank
    private String rawPassword;
}
