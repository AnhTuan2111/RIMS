package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueAnomalyResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueChartPointResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueReportResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;


public interface RevenueReportService
{
    //View total revenue by period;
    RevenueReportResponse getTotalRevenue();

    RevenueReportResponse getTodayRevenue();

    RevenueReportResponse getWeeklyRevenue();

    RevenueReportResponse getMonthlyRevenue();

    RevenueReportResponse getYearlyRevenue();

    RevenueReportResponse getRevenueBetween(
            LocalDate fromDate,
            LocalDate toDate
    );

    // compare revenue between 2 periods.
    RevenueComparisonResponse compareRevenue(
            LocalDate startDate1,
            LocalDate endDate1,
            LocalDate startDate2,
            LocalDate endDate2
    );

    RevenueAnomalyResponse detectRevenueAnomaly(
            LocalDate targetDate,
            Integer referenceDays,
            BigDecimal spikeThresholdPercent,
            BigDecimal dropThresholdPercent
    );

    List<RevenueChartPointResponse> getRevenueChartData(
            LocalDate fromDate,
            LocalDate toDate,
            Integer referenceDays,
            BigDecimal spikeThresholdPercent,
            BigDecimal dropThresholdPercent
    );

    // best-selling
    BestSellingReportResponse getBestSellingReport();
}
