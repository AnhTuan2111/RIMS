package vn.edu.fpt.swp391.g6.rimsapi.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

@Entity
@Table(name = "restaurant_tables")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class RestaurantTable
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_id", nullable = false)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String tableNumber;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    private TableStatus status;

    /**
     * Bàn còn nằm trong sơ đồ hay đã cất đi.
     *
     * <p>Tách hẳn khỏi {@link TableStatus}: status là tình trạng lúc này (trống, đã
     * đặt, đang phục vụ) và bị các luồng vận hành đổi liên tục, còn đây là quyết
     * định của quản lý. Nhét "đã cất" vào status thì một lần dọn bàn là bàn đã cất
     * lại hiện về sơ đồ.
     *
     * <p>Bàn đã cất vẫn giữ nguyên lịch sử đơn và hoá đơn — báo cáo doanh thu của
     * những ngày đã qua không được thủng vì hôm nay kê lại bàn.
     */
    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "table")
    private List<Reservation> reservations;

    @OneToMany(mappedBy = "table")
    private List<Order> orders;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
