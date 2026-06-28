package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.Data;

import java.math.BigDecimal;


@Data
public class RevenueComparisonResponse
{

    private BigDecimal previousRevenue;

    private BigDecimal currentRevenue;

    private BigDecimal difference;

    private BigDecimal growthRate;

    private long previousDays;

    private long currentDays;

    private BigDecimal previousAverageRevenue;

    private BigDecimal currentAverageRevenue;
}
