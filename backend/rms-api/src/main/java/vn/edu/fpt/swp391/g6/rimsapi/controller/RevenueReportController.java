package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.RevenueReportService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class RevenueReportController {

    private final RevenueReportService revenueReportService;

    private boolean checkAdmin(String username, String password) {

        return "admin01".equals(username)
                && "hash_pass_123".equals(password);
    }

    @GetMapping("/total")
    public RevenueReportResponse getTotalRevenue() {
        return revenueReportService.getTotalRevenue();
    }

    @GetMapping("/today")
    public RevenueReportResponse getTodayRevenue() {
        return revenueReportService.getTodayRevenue();
    }

    @GetMapping("/weekly")
    public RevenueReportResponse getWeeklyRevenue() {
        return revenueReportService.getWeeklyRevenue();
    }

    @GetMapping("/monthly")
    public RevenueReportResponse getMonthlyRevenue() {
        return revenueReportService.getMonthlyRevenue();
    }

    @GetMapping("/custom")
    public RevenueReportResponse getCustomRevenue(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {

        return revenueReportService
                .getRevenueBetween(
                        fromDate,
                        toDate
                );
    }
    //get bestselling.
    @GetMapping("/best-selling")
    public BestSellingReportResponse getBestSellingReport() {

        return revenueReportService
                .getBestSellingReport();
    }

}