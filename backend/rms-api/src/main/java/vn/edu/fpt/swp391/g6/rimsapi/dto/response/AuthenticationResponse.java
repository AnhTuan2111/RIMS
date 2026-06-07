package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import lombok.*;


@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse
{
    private String token;
    private RoleType role;
}