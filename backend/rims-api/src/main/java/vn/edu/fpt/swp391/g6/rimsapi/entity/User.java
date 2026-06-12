package vn.edu.fpt.swp391.g6.rimsapi.entity;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User
{
    @Id
    @Column(name = "user_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false, length = 10)
    private RoleType role;

    @NotBlank
    @Column(nullable = false, length = 50, unique = true)
    private String username;

    @NotBlank
    @Nationalized
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    @Column(name = "full_name", nullable = false, length = 50)
    private String fullName;

    @Email
    @Column(unique = true, length = 50)
    private String email;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "is_active")
    private boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "createdBy")
    private List<Order> orders;
}
