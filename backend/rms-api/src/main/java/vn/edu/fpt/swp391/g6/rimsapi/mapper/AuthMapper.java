package vn.edu.fpt.swp391.g6.rimsapi.mapper;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.LoginResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface AuthMapper
{
    @Mapping(source = "id", target = "userId")
    LoginResponse toLoginResponse(User user);
}
