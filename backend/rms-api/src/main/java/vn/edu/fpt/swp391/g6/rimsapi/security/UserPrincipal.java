package vn.edu.fpt.swp391.g6.rimsapi.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;

@Getter
@AllArgsConstructor
public class UserPrincipal
{
    private final Integer id;
    private final String username;
    private final RoleType role;
}
