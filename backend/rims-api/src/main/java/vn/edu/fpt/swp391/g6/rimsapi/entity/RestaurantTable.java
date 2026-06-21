package vn.edu.fpt.swp391.g6.rimsapi.entity;

import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;


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
    private int id;

    @Column(name = "table_number", nullable = false, unique = true)
    private String tableNumber;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    private TableStatus status;

    @OneToMany(mappedBy = "table")
    private List<Reservation> reservations;

    @OneToMany(mappedBy = "table")
    private List<Order> orders;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
