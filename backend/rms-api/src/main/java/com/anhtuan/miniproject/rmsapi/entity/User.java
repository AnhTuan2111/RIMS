package com.anhtuan.miniproject.rmsapi.entity;

import com.anhtuan.miniproject.rmsapi.enums.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;


@Entity
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User
{
    @Id
    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;

    @NotBlank
    @Nationalized
    @Pattern(regexp = "^[\\p{L} ]+$")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    @Column(nullable = false, unique = true)
    private String phone;

    @NotBlank
    @Column(name="password_hash",nullable = false)
    private String passwordHash;

    // true = active, false = inactive
    @Column(nullable = false)
    private Boolean status = true;

    @CreatedDate
    @Column(name = "create_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "update_at", nullable = false)
    private LocalDateTime updatedAt;

}
