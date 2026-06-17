
package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChefDashboardResponse {

    // Số món đang chuẩn bị
    private long preparingCount;

    // Số món đã hoàn thành
    private long completedCount;

    // Số món đang tạm hết
    private long unavailableDishCount;
}

