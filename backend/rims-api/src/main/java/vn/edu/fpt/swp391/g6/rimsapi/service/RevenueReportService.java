package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.*;

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

    // best-selling
    BestSellingReportResponse getBestSellingReport(
            String period,
            Integer categoryId
    );

    BestSellingReportResponse getBestSellingReport(
            LocalDate fromDate,
            LocalDate toDate,
            Integer categoryId
    );

    OrderShiftReportResponse getOrderShiftReport(String period);

    OrderShiftReportResponse getOrderShiftReport(
            LocalDate fromDate,
            LocalDate toDate
    );
}
