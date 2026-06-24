package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RevenueAlertStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueChartPointResponse {

    private LocalDate date;

    private BigDecimal revenue;

    private BigDecimal referenceAverageRevenue;

    private BigDecimal changeRatePercent;

    private RevenueAlertStatus alertStatus;
}
