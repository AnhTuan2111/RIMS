package vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation;

import lombok.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;

import java.time.LocalDateTime;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReservationDetailResponse
{
    private Long reservationId;
    private String customerName;
    private String phone;
    private String note;
    private Integer tableId;
    private ReservationStatus status;
    private LocalDateTime reservationTime;
    private LocalDateTime createdAt;
}
