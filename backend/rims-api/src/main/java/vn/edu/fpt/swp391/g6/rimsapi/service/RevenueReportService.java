package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.OrderShiftReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.WeeklyRevenueChartResponse;

import java.time.LocalDate;


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

    WeeklyRevenueChartResponse getDailyRevenue(
            LocalDate fromDate,
            LocalDate toDate
    );

    // compare revenue between 2 periods.
    RevenueComparisonResponse compareRevenue(
            LocalDate previousStartDate,
            LocalDate previousEndDate,
            LocalDate currentStartDate,
            LocalDate currentEndDate
    );

    // best-selling
    BestSellingReportResponse getBestSellingReport(String period);

    BestSellingReportResponse getBestSellingReport(
            LocalDate fromDate,
            LocalDate toDate
    );

    OrderShiftReportResponse getOrderShiftReport(String period);

    OrderShiftReportResponse getOrderShiftReport(
            LocalDate fromDate,
            LocalDate toDate
    );
}
