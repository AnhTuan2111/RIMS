package com.anhtuan.miniproject.rmsapi.repository;

import com.anhtuan.miniproject.rmsapi.entity.User;

import java.util.List;
import java.util.Optional;

import com.anhtuan.miniproject.rmsapi.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User, Integer>
{
    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    List<User> findByRole(RoleType role);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
