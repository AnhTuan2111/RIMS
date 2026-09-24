package vn.edu.fpt.swp391.g6.rimsapi.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;

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
    @Column(nullable = false, length = 10)
    private RoleType role;

    @Column(nullable = false, length = 50, unique = true)
    private String username;

    @Nationalized
    @Column(nullable = false, length = 50)
    private String fullName;

    @Column(unique = true, length = 50)
    private String email;

    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Column(nullable = false)
    private String passwordHash;
    /**
     * Mật khẩu hiện tại do người khác đặt, chủ tài khoản phải đổi trước khi
     * dùng hệ thống.
     *
     * <p>Bật khi tài khoản vừa được tạo hoặc vừa được Quản trị viên đặt lại —
     * những lúc mật khẩu là {@code AccountDefaults.DEFAULT_PASSWORD} hoặc do
     * Quản trị viên chọn hộ. Tắt khi chính chủ đổi mật khẩu, kể cả qua luồng
     * quên mật khẩu bằng OTP.
     *
     * <p>Mặc định false để các tài khoản đã có sẵn trong cơ sở dữ liệu không
     * bị chặn ngay khi nâng cấp.
     *
     * <p>{@code @ColumnDefault} là bắt buộc chứ không phải cho đẹp: SQL Server từ
     * chối {@code ALTER TABLE ... ADD <cột> NOT NULL} trên bảng đã có dòng nếu
     * không kèm DEFAULT. Thiếu dòng này thì mọi cơ sở dữ liệu đang chạy đều
     * không nâng cấp được: Hibernate báo WARN rồi đi tiếp, ứng dụng khởi động
     * bình thường, nhưng mọi truy vấn bảng users đều lỗi vì cột không tồn tại.
     */
    @Column(nullable = false)
    @ColumnDefault("0")
    private boolean mustChangePassword = false;

    private boolean isActive = true;

    @Column(nullable = false)
    private Integer rewardPoints = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "createdBy")
    private List<Order> orders;
}
