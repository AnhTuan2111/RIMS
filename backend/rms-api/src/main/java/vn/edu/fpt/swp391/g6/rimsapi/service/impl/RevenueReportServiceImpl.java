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

    @Override
    public RevenueReportResponse getWeeklyRevenue() {

        LocalDate now = LocalDate.now();

        LocalDate startWeek =
                now.with(
                        TemporalAdjusters.previousOrSame(
                                DayOfWeek.MONDAY
                        )
                );

        return getRevenueBetween(
                startWeek,
                now
        );
    }

    @Override
    public RevenueReportResponse getMonthlyRevenue() {

        LocalDate now = LocalDate.now();

        LocalDate startMonth =
                now.withDayOfMonth(1);

        return getRevenueBetween(
                startMonth,
                now
        );
    }

    @Override
    public RevenueReportResponse getYearlyRevenue() {

        LocalDate now = LocalDate.now();

        LocalDate startYear =
                now.withDayOfYear(1);

        return getRevenueBetween(
                startYear,
                now
        );
    }

    @Override
    public RevenueReportResponse getRevenueBetween(
            LocalDate fromDate,
            LocalDate toDate) {

        LocalDate today = LocalDate.now();

        //Don't allow future dates
        if (toDate.isAfter(today)) {
            toDate = today;
        }

        // Validate date range
        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException(
                    "fromDate must be before or equal to toDate"
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


    //compare revenue

    @Override
    public RevenueComparisonResponse compareRevenue(
            LocalDate startDate1,
            LocalDate endDate1,
            LocalDate startDate2,
            LocalDate endDate2
    ) {

        System.out.println("===== COMPARE =====");

        System.out.println("Period A");
        System.out.println(startDate1 + " -> " + endDate1);

        System.out.println("Period B");
        System.out.println(startDate2 + " -> " + endDate2);

        LocalDate today = LocalDate.now();

        // Không cho phép ngày kết thúc ở tương lai
        if (endDate1.isAfter(today)) {
            endDate1 = today;
        }

        if (endDate2.isAfter(today)) {
            endDate2 = today;
        }

        // Validate period 1
        if (startDate1.isAfter(endDate1)) {
            throw new RuntimeException(
                    "Period A start date must be before end date"
            );
        }

        // Validate period 2
        if (startDate2.isAfter(endDate2)) {
            throw new RuntimeException(
                    "Period B start date must be before end date"
            );
        }

        long days1 =
                ChronoUnit.DAYS.between(
                        startDate1,
                        endDate1
                ) + 1;

        long days2 =
                ChronoUnit.DAYS.between(
                        startDate2,
                        endDate2
                ) + 1;

        System.out.println("days1 = " + days1);
        System.out.println("days2 = " + days2);
        System.out.println(
                "differenceDays = "
                        + Math.abs(days1 - days2)
        );

        long differenceDays =
                Math.abs(days1 - days2);




        // Nếu khoảng hiện tại quá ngắn so với khoảng còn lại
        if (differenceDays > 3) {

            if (days1 < days2) {

                throw new RuntimeException(
                        "The current period does not have enough data for comparison yet"
                );
            }

            throw new RuntimeException(
                    "The selected periods are too different in length to compare"
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

        if (revenue1 == null) {
            revenue1 = BigDecimal.ZERO;
        }

        if (revenue2 == null) {
            revenue2 = BigDecimal.ZERO;
        }

        BigDecimal difference =
                revenue1.subtract(revenue2);

        double growthRate = 0;

        if (revenue2.compareTo(BigDecimal.ZERO) > 0) {

            growthRate =
                    difference.doubleValue()
                            / revenue2.doubleValue()
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

        response.setAverageRevenue1(
                averageRevenue1
        );

        response.setAverageRevenue2(
                averageRevenue2
        );

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