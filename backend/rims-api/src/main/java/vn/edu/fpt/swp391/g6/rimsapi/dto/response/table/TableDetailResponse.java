package vn.edu.fpt.swp391.g6.rimsapi.dto.response.table;

import lombok.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

import java.time.LocalDateTime;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TableDetailResponse
{
    private Integer tableId;
    private String tableNumber;
    private Integer capacity;
    private TableStatus status;
    private LocalDateTime upcomingReservationTime;
    private String upcomingCustomerName;
}
