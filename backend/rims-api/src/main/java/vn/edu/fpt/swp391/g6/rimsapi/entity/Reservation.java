package vn.edu.fpt.swp391.g6.rimsapi.entity;

import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
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
public class Reservation
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;

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

    private Integer numberOfGuests;

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
