package vn.edu.fpt.swp391.g6.rimsapi.entity;

import java.time.LocalDateTime;

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
    @Column(length = 100)
    private String note;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    /**
     * Tới giờ giữ bàn mà KHÔNG xếp được bàn: bàn đã đặt còn khách (hoặc đang
     * giữ cho lượt khác) và không còn bàn trống nào đủ chỗ.
     *
     * <p>Trước đây trường hợp này bị HUỶ lặng lẽ — khách đến nơi mới biết mình
     * không còn lượt. Nay lượt đặt vẫn giữ, được đánh dấu, và phục vụ được báo
     * để xử lý: đổi bàn, đổi giờ, gọi báo khách, hoặc chờ bàn trống.
     */
    @Column(name = "needs_attention", nullable = false)
    private boolean needsAttention = false;

    @ManyToOne
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
