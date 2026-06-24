package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.BestSellingDishItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.BestSellingReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueAnomalyResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueChartPointResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueReportResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RevenueAlertStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;
import vn.edu.fpt.swp391.g6.rimsapi.service.RevenueReportService;

import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RevenueReportServiceImpl implements RevenueReportService {

    private static final int DEFAULT_REFERENCE_DAYS = 7;
    private static final BigDecimal DEFAULT_SPIKE_THRESHOLD_PERCENT =
            BigDecimal.valueOf(30);
    private static final BigDecimal DEFAULT_DROP_THRESHOLD_PERCENT =
            BigDecimal.valueOf(30);
    private static final BigDecimal ONE_HUNDRED =
            BigDecimal.valueOf(100);
    private static final int GROWTH_RATE_DIVISION_SCALE = 4;
    private static final int PERCENT_OUTPUT_SCALE = 2;

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

        // Kiem tra khoang hien tai
        if (startDate1.isAfter(endDate1)) {
            throw new RuntimeException(
                    "Current period start date must be before end date"
            );
        }

        // Kiem tra khoang truoc do
        if (startDate2.isAfter(endDate2)) {
            throw new RuntimeException(
                    "Previous period start date must be before end date"
            );
        }

        // Kiem tra khoang hien tai phai nam sau khoang truoc do
        if (!startDate1.isAfter(endDate2)) {
            throw new RuntimeException(
                    "The current period must be after the previous period"
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

        BigDecimal growthRate =
                BigDecimal.ZERO.setScale(
                        PERCENT_OUTPUT_SCALE,
                        RoundingMode.HALF_UP
                );
        String message = null;

        if (revenue2.compareTo(BigDecimal.ZERO) > 0) {

            growthRate =
                    calculateGrowthRate(
                            difference,
                            revenue2
                    );

        } else {

            message =
                    "Previous period has no revenue data";
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

        response.setMessage(message);

        return response;
    }

    @Override
    public RevenueAnomalyResponse detectRevenueAnomaly(
            LocalDate targetDate,
            Integer referenceDays,
            BigDecimal spikeThresholdPercent,
            BigDecimal dropThresholdPercent
    ) {

        int resolvedReferenceDays =
                resolveReferenceDays(referenceDays);

        BigDecimal resolvedSpikeThreshold =
                resolveThreshold(
                        spikeThresholdPercent,
                        DEFAULT_SPIKE_THRESHOLD_PERCENT,
                        "spikeThresholdPercent"
                );

        BigDecimal resolvedDropThreshold =
                resolveThreshold(
                        dropThresholdPercent,
                        DEFAULT_DROP_THRESHOLD_PERCENT,
                        "dropThresholdPercent"
                );

        validateTargetDate(targetDate);

        BigDecimal currentRevenue =
                getInvoiceRevenueForDate(targetDate);

        LocalDate referenceStartDate =
                targetDate.minusDays(resolvedReferenceDays);

        LocalDate referenceEndDate =
                targetDate.minusDays(1);

        BigDecimal referenceRevenue =
                getInvoiceRevenueBetween(
                        referenceStartDate,
                        referenceEndDate
                );

        BigDecimal referenceAverageRevenue =
                referenceRevenue.divide(
                        BigDecimal.valueOf(resolvedReferenceDays),
                        2,
                        RoundingMode.HALF_UP
                );

        RevenueAlertStatus alertStatus;
        BigDecimal changeRatePercent = null;

        if (referenceAverageRevenue.compareTo(BigDecimal.ZERO) == 0) {

            alertStatus =
                    RevenueAlertStatus.NOT_ENOUGH_DATA;

        } else {

            changeRatePercent =
                    calculateGrowthRate(
                            currentRevenue.subtract(referenceAverageRevenue),
                            referenceAverageRevenue
                    );

            if (changeRatePercent.compareTo(resolvedSpikeThreshold) >= 0) {

                alertStatus =
                        RevenueAlertStatus.SPIKE;

            } else if (
                    changeRatePercent.compareTo(
                            resolvedDropThreshold.negate()
                    ) <= 0
            ) {

                alertStatus =
                        RevenueAlertStatus.DROP;

            } else {

                alertStatus =
                        RevenueAlertStatus.NORMAL;
            }
        }

        return new RevenueAnomalyResponse(
                targetDate,
                currentRevenue,
                referenceAverageRevenue,
                changeRatePercent,
                alertStatus,
                buildAnomalyMessage(
                        alertStatus,
                        changeRatePercent,
                        resolvedReferenceDays
                )
        );
    }

    @Override
    public List<RevenueChartPointResponse> getRevenueChartData(
            LocalDate fromDate,
            LocalDate toDate,
            Integer referenceDays,
            BigDecimal spikeThresholdPercent,
            BigDecimal dropThresholdPercent
    ) {

        if (fromDate == null || toDate == null) {
            throw new RuntimeException(
                    "fromDate and toDate are required"
            );
        }

        LocalDate today =
                LocalDate.now();

        if (toDate.isAfter(today)) {
            toDate = today;
        }

        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException(
                    "fromDate must be before or equal to toDate"
            );
        }

        List<RevenueChartPointResponse> points =
                new ArrayList<>();

        LocalDate currentDate =
                fromDate;

        while (!currentDate.isAfter(toDate)) {

            RevenueAnomalyResponse anomaly =
                    detectRevenueAnomaly(
                            currentDate,
                            referenceDays,
                            spikeThresholdPercent,
                            dropThresholdPercent
                    );

            points.add(
                    new RevenueChartPointResponse(
                            anomaly.getTargetDate(),
                            anomaly.getCurrentRevenue(),
                            anomaly.getReferenceAverageRevenue(),
                            anomaly.getChangeRatePercent(),
                            anomaly.getAlertStatus()
                    )
            );

            currentDate =
                    currentDate.plusDays(1);
        }

        return points;
    }

    private BigDecimal getInvoiceRevenueForDate(LocalDate date) {

        return getInvoiceRevenueBetween(
                date,
                date
        );
    }

    private BigDecimal getInvoiceRevenueBetween(
            LocalDate startDate,
            LocalDate endDate
    ) {

        BigDecimal revenue =
                invoiceRepository.getRevenueBetween(
                        startDate.atStartOfDay(),
                        endDate.atTime(LocalTime.MAX)
                );

        if (revenue == null) {
            return BigDecimal.ZERO;
        }

        return revenue;
    }

    private BigDecimal calculateGrowthRate(
            BigDecimal difference,
            BigDecimal baseRevenue
    ) {

        return difference
                .divide(
                        baseRevenue,
                        GROWTH_RATE_DIVISION_SCALE,
                        RoundingMode.HALF_UP
                )
                .multiply(ONE_HUNDRED)
                .setScale(
                        PERCENT_OUTPUT_SCALE,
                        RoundingMode.HALF_UP
                );
    }

    private void validateTargetDate(LocalDate targetDate) {

        if (targetDate == null) {
            throw new RuntimeException(
                    "targetDate is required"
            );
        }

        if (targetDate.isAfter(LocalDate.now())) {
            throw new RuntimeException(
                    "targetDate must not be in the future"
            );
        }
    }

    private int resolveReferenceDays(Integer referenceDays) {

        int resolvedReferenceDays =
                referenceDays == null
                        ? DEFAULT_REFERENCE_DAYS
                        : referenceDays;

        if (resolvedReferenceDays <= 0) {
            throw new RuntimeException(
                    "referenceDays must be greater than 0"
            );
        }

        return resolvedReferenceDays;
    }

    private BigDecimal resolveThreshold(
            BigDecimal threshold,
            BigDecimal defaultThreshold,
            String fieldName
    ) {

        BigDecimal resolvedThreshold =
                threshold == null
                        ? defaultThreshold
                        : threshold;

        if (resolvedThreshold.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    fieldName + " must not be negative"
            );
        }

        return resolvedThreshold;
    }

    private String buildAnomalyMessage(
            RevenueAlertStatus alertStatus,
            BigDecimal changeRatePercent,
            int referenceDays
    ) {

        if (alertStatus == RevenueAlertStatus.SPIKE) {
            return "Revenue increased by "
                    + changeRatePercent.abs().toPlainString()
                    + "% compared with the average revenue of the previous "
                    + referenceDays
                    + " days.";
        }

        if (alertStatus == RevenueAlertStatus.DROP) {
            return "Revenue decreased by "
                    + changeRatePercent.abs().toPlainString()
                    + "% compared with the average revenue of the previous "
                    + referenceDays
                    + " days.";
        }

        if (alertStatus == RevenueAlertStatus.NOT_ENOUGH_DATA) {
            return "Not enough reference revenue data to detect abnormal revenue.";
        }

        return "Revenue is within the normal range.";
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
