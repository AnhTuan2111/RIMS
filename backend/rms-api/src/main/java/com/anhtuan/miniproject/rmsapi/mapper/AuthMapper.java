package com.anhtuan.miniproject.rmsapi.mapper;

import com.anhtuan.miniproject.rmsapi.dto.response.LoginResponse;
import com.anhtuan.miniproject.rmsapi.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface AuthMapper
{
    @Mapping(source = "id", target = "userId")
    LoginResponse toLoginResponse(User user);
}
