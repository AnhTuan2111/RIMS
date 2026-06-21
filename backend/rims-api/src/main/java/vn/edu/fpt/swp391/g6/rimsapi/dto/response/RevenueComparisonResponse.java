package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RevenueComparisonResponse {

    private BigDecimal revenue1;

    private BigDecimal revenue2;

    private BigDecimal difference;

    private double growthRate;

    private long days1;

    private long days2;

    private BigDecimal averageRevenue1;

    private BigDecimal averageRevenue2;
}