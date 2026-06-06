package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TableDashboardResponse {
    private Integer tableId;
    private String tableNumber;
    private TableStatus status; // AVAILABLE, RESERVED, SERVING
    private Long orderId;       // Sẽ có ID nếu bàn đang SERVING, ngược lại là null
}