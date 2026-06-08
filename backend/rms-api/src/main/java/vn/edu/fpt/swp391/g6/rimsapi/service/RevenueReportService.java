package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueReportResponse;

import java.time.LocalDate;

public interface RevenueReportService {
    RevenueReportResponse getTotalRevenue();

    RevenueReportResponse getTodayRevenue();

    RevenueReportResponse getWeeklyRevenue();

    RevenueReportResponse getMonthlyRevenue();

    RevenueReportResponse getRevenueBetween(
            LocalDate fromDate,
            LocalDate toDate
    );

    // best-selling

    BestSellingReportResponse getBestSellingReport();


}
