package vn.edu.fpt.swp391.g6.rimsapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;

import java.time.LocalDateTime;


@Entity
@Table(name = "reservations", indexes = @Index(columnList = "reservation_time"))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Reservation
{
    @Id
    @Column(name = "reservation_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nationalized
    @Column(name = "customer_name", nullable = false, length = 50)
    private String customerName;

    @Column(nullable = false, length = 10)
    private String phone;

    private LocalDateTime reservationTime;

    @Nationalized
    private String note;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    @ManyToOne
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // 🔥 THÊM MỚI: Liên kết với User
    @ManyToOne
    @JoinColumn(name = "user_id")  // Thêm cột user_id trong bảng reservations
    private User user;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}