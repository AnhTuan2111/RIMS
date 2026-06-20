package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class RevenueReportResponse {
    private BigDecimal revenue;
    private String period;

}
