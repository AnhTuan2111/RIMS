package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueReportResponse;

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

    // compare revenue between 2 periods.
    RevenueComparisonResponse compareRevenue(
            LocalDate startDate1,
            LocalDate endDate1,
            LocalDate startDate2,
            LocalDate endDate2
    );

    // best-selling
    BestSellingReportResponse getBestSellingReport();
}
