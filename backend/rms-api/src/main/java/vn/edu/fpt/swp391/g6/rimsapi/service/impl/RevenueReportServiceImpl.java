package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BestSellingDishItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.RevenueReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;
import vn.edu.fpt.swp391.g6.rimsapi.service.RevenueReportService;

import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

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

    public RevenueReportResponse getWeeklyRevenue() {
        LocalDate now = LocalDate.now();

        // Tìm ngày Thứ Hai của tuần này
        LocalDate startWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Tìm ngày Chủ Nhật của tuần này
        LocalDate endWeek = now.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        return getRevenueBetween(startWeek, endWeek);
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

    @Override
    public RevenueComparisonResponse compareRevenue(
            LocalDate startDate1,
            LocalDate endDate1,
            LocalDate startDate2,
            LocalDate endDate2
    ) {

        long days1 =
                ChronoUnit.DAYS.between(startDate1, endDate1) + 1;

        long days2 =
                ChronoUnit.DAYS.between(startDate2, endDate2) + 1;

        if (Math.abs(days1 - days2) > 3) {
            throw new RuntimeException(
                    "The difference in days must not exceed 3"
            );
        }

        BigDecimal revenue1 =
                invoiceRepository.getRevenueBetween(
                        startDate1.atStartOfDay(),
                        endDate1.atTime(23, 59, 59)
                );

        BigDecimal revenue2 =
                invoiceRepository.getRevenueBetween(
                        startDate2.atStartOfDay(),
                        endDate2.atTime(23, 59, 59)
                );

        BigDecimal difference =
                revenue2.subtract(revenue1);

        double growthRate = 0;

        if (revenue1.compareTo(BigDecimal.ZERO) > 0) {

            growthRate =
                    difference.doubleValue()
                            / revenue1.doubleValue()
                            * 100;
        }

        BigDecimal averageRevenue1 =
                revenue1.divide(
                        BigDecimal.valueOf(days1),
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal averageRevenue2 =
                revenue2.divide(
                        BigDecimal.valueOf(days2),
                        2,
                        RoundingMode.HALF_UP
                );

        RevenueComparisonResponse response =
                new RevenueComparisonResponse();

        response.setRevenue1(revenue1);
        response.setRevenue2(revenue2);

        response.setDifference(difference);

        response.setGrowthRate(growthRate);

        response.setDays1(days1);
        response.setDays2(days2);

        response.setAverageRevenue1(averageRevenue1);
        response.setAverageRevenue2(averageRevenue2);

        return response;
    }

    //Best selling

    @Override
    public BestSellingReportResponse getBestSellingReport() {

        LocalDate fromDate =
                LocalDate.now().withDayOfMonth(1);

        LocalDate toDate =
                LocalDate.now();

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                LocalDateTime.now();

        Pageable top10 =
                PageRequest.of(0, 10);

        List<BestSellingDishProjection> result =
                invoiceRepository.getBestSellingDishes(
                        start,
                        end,
                        top10
                );

        List<BestSellingDishItemResponse> items =
                new ArrayList<>();

        int rank = 1;

        for (BestSellingDishProjection row : result) {

            items.add(
                    new BestSellingDishItemResponse(
                            rank++,
                            row.getDishName(),
                            row.getTotalQuantity(),
                            row.getTotalRevenue()
                    )
            );
        }

        return new BestSellingReportResponse(
                fromDate,
                toDate,
                "Current month until now",
                items
        );
    }
}