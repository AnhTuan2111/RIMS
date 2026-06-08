package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.RevenueReportService;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RevenueReportServiceImpl implements RevenueReportService {

    private final InvoiceRepository invoiceRepository;

    @Override
    public RevenueReportResponse getTotalRevenue() {

        BigDecimal revenue =
                invoiceRepository.getTotalRevenue();

        return new RevenueReportResponse(
                revenue,
                "ALL"
        );
    }

    @Override
    public RevenueReportResponse getTodayRevenue() {

        LocalDate today = LocalDate.now();

        return getRevenueBetween(today, today);
    }

    @Override
    public RevenueReportResponse getWeeklyRevenue() {

        LocalDate startWeek =
                LocalDate.now().with(DayOfWeek.MONDAY);

        LocalDate endWeek =
                LocalDate.now().with(DayOfWeek.SUNDAY);

        return getRevenueBetween(
                startWeek,
                endWeek
        );
    }

    @Override
    public RevenueReportResponse getMonthlyRevenue() {

        LocalDate now = LocalDate.now();

        LocalDate startMonth =
                now.withDayOfMonth(1);

        LocalDate endMonth =
                now.withDayOfMonth(
                        now.lengthOfMonth()
                );

        return getRevenueBetween(
                startMonth,
                endMonth
        );
    }

    @Override
    public RevenueReportResponse getRevenueBetween(
            LocalDate fromDate,
            LocalDate toDate) {

        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException(
                    "fromDate must be before toDate"
            );
        }

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                toDate.atTime(23, 59, 59);

        BigDecimal revenue =
                invoiceRepository.getRevenueBetween(
                        start,
                        end
                );

        return new RevenueReportResponse(
                revenue,
                fromDate + " - " + toDate
        );
    }
}