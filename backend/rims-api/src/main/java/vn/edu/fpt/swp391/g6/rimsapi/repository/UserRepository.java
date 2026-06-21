package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.User;

import java.util.List;
import java.util.Optional;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User, Integer>
{
    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    List<User> findByRole(RoleType role);

    List<User> findByRoleIn(List<RoleType> roles);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    Integer id(Integer id);
}
