package vn.edu.fpt.swp391.g6.rimsapi.entity;

import jakarta.validation.constraints.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Reservation {
    @Id
    @Column(name = "reservation_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Nationalized
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    @Column(name = "customer_name", nullable = false, length = 50)
    private String customerName;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    @Column(nullable = false, length = 10)
    private String phone;

    private LocalDateTime reservationTime;

    @Min(1)
    @Max(8)
    @Column(nullable = false, name = "number_of_guests")
    private Integer numberOfGuests;

    @Size(max = 2000)
    @Nationalized
    private String note;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    @ManyToOne
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
