package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.DailyRevenueProjection;
import vn.edu.fpt.swp391.g6.rimsapi.service.RevenueReportService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;


@Service
@RequiredArgsConstructor
public class RevenueReportServiceImpl implements RevenueReportService
{

    private final InvoiceRepository invoiceRepository;

    @Override
    public RevenueReportResponse getTotalRevenue()
    {

        BigDecimal revenue =
                invoiceRepository.getTotalRevenue();

        return new RevenueReportResponse(
                revenue,
                "ALL"
        );
    }

    @Override
    public RevenueReportResponse getTodayRevenue()
    {

        LocalDate today = LocalDate.now();

        return getRevenueBetween(today, today);
    }

    @Override
    public RevenueReportResponse getWeeklyRevenue()
    {

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
    public RevenueReportResponse getMonthlyRevenue()
    {

        LocalDate now = LocalDate.now();

        LocalDate startMonth =
                now.withDayOfMonth(1);

        return getRevenueBetween(
                startMonth,
                now
        );
    }

    @Override
    public RevenueReportResponse getYearlyRevenue()
    {

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
            LocalDate toDate)
    {

        LocalDate today = LocalDate.now();

        //Don't allow future dates
        if (toDate.isAfter(today))
        {
            toDate = today;
        }

        // Validate date range
        if (fromDate.isAfter(toDate))
        {
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

    @Override
    public WeeklyRevenueChartResponse getDailyRevenue(
            LocalDate fromDate,
            LocalDate toDate
    )
    {

        LocalDate today =
                LocalDate.now();

        if (toDate.isAfter(today))
        {
            toDate =
                    today;
        }

        if (fromDate.isAfter(toDate))
        {
            throw new RuntimeException(
                    "fromDate must be before or equal to toDate"
            );
        }

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                toDate.atTime(23, 59, 59);

        List<DailyRevenueProjection> rows =
                invoiceRepository.getDailyRevenueBetween(
                        start,
                        end
                );

        Map<LocalDate, BigDecimal> revenueByDate =
                new HashMap<>();

        for (DailyRevenueProjection row : rows)
        {
            if (row.getRevenueDate() == null)
            {
                continue;
            }

            revenueByDate.put(
                    row.getRevenueDate(),
                    row.getRevenue() == null
                            ? BigDecimal.ZERO
                            : row.getRevenue()
            );
        }

        List<DailyRevenueItemResponse> items =
                new ArrayList<>();

        LocalDate currentDate =
                fromDate;

        while (!currentDate.isAfter(toDate))
        {
            items.add(
                    new DailyRevenueItemResponse(
                            getDayLabel(
                                    currentDate.getDayOfWeek()
                            ),
                            currentDate,
                            revenueByDate.getOrDefault(
                                    currentDate,
                                    BigDecimal.ZERO
                            )
                    )
            );

            currentDate =
                    currentDate.plusDays(1);
        }

        return new WeeklyRevenueChartResponse(
                fromDate,
                toDate,
                items
        );
    }


    //compare revenue

    @Override
    public RevenueComparisonResponse compareRevenue(
            LocalDate previousStartDate,
            LocalDate previousEndDate,
            LocalDate currentStartDate,
            LocalDate currentEndDate
    )
    {

        System.out.println("===== COMPARE =====");

        System.out.println("Previous period");
        System.out.println(previousStartDate + " -> " + previousEndDate);

        System.out.println("Current period");
        System.out.println(currentStartDate + " -> " + currentEndDate);

        LocalDate today = LocalDate.now();

        // Không cho phép ngày kết thúc ở tương lai
        if (previousEndDate.isAfter(today))
        {
            previousEndDate = today;
        }

        if (currentEndDate.isAfter(today))
        {
            currentEndDate = today;
        }

        // Validate previous period
        if (previousStartDate.isAfter(previousEndDate))
        {
            throw new RuntimeException(
                    "Previous period start date must be before end date"
            );
        }

        // Validate current period
        if (currentStartDate.isAfter(currentEndDate))
        {
            throw new RuntimeException(
                    "Current period start date must be before end date"
            );
        }

        if (!previousEndDate.isBefore(currentStartDate))
        {
            throw new RuntimeException(
                    "Previous period must be before current period"
            );
        }

        long previousDays =
                ChronoUnit.DAYS.between(
                        previousStartDate,
                        previousEndDate
                ) + 1;

        long currentDays =
                ChronoUnit.DAYS.between(
                        currentStartDate,
                        currentEndDate
                ) + 1;

        long differenceDays =
                Math.abs(previousDays - currentDays);

        // Nếu khoảng hiện tại quá ngắn so với khoảng trước đó
        if (differenceDays > 3)
        {

            if (currentDays < previousDays)
            {

                throw new RuntimeException(
                        "The current period does not have enough data for comparison yet"
                );
            }

            throw new RuntimeException(
                    "The selected periods are too different in length to compare"
            );
        }

        BigDecimal previousRevenue =
                invoiceRepository.getRevenueBetween(
                        previousStartDate.atStartOfDay(),
                        previousEndDate.atTime(23, 59, 59)
                );

        BigDecimal currentRevenue =
                invoiceRepository.getRevenueBetween(
                        currentStartDate.atStartOfDay(),
                        currentEndDate.atTime(23, 59, 59)
                );

        if (previousRevenue == null)
        {
            previousRevenue = BigDecimal.ZERO;
        }

        if (currentRevenue == null)
        {
            currentRevenue = BigDecimal.ZERO;
        }

        BigDecimal difference =
                currentRevenue.subtract(previousRevenue);

        BigDecimal growthRate =
                BigDecimal.ZERO.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        if (previousRevenue.compareTo(BigDecimal.ZERO) > 0)
        {

            growthRate =
                    difference
                            .divide(
                                    previousRevenue,
                                    10,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(
                                    BigDecimal.valueOf(100)
                            )
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );
        }

        BigDecimal previousAverageRevenue =
                previousRevenue.divide(
                        BigDecimal.valueOf(previousDays),
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal currentAverageRevenue =
                currentRevenue.divide(
                        BigDecimal.valueOf(currentDays),
                        2,
                        RoundingMode.HALF_UP
                );

        RevenueComparisonResponse response =
                new RevenueComparisonResponse();

        response.setPreviousRevenue(previousRevenue);
        response.setCurrentRevenue(currentRevenue);

        response.setDifference(difference);

        response.setGrowthRate(growthRate);

        response.setPreviousDays(previousDays);
        response.setCurrentDays(currentDays);

        response.setPreviousAverageRevenue(
                previousAverageRevenue
        );

        response.setCurrentAverageRevenue(
                currentAverageRevenue
        );

        return response;
    }

    //Best selling

    @Override
    public BestSellingReportResponse getBestSellingReport(String period)
    {

        LocalDate today =
                LocalDate.now();

        String normalizedPeriod =
                period == null
                        ? "WEEK"
                        : period.toUpperCase(Locale.ROOT);

        LocalDate fromDate;
        LocalDate toDate;
        String dataRangeNote;

        switch (normalizedPeriod)
        {
            case "WEEK" ->
            {
                fromDate =
                        today.with(
                                TemporalAdjusters.previousOrSame(
                                        DayOfWeek.MONDAY
                                )
                        );

                toDate =
                        today.with(
                                TemporalAdjusters.nextOrSame(
                                        DayOfWeek.SUNDAY
                                )
                        );

                dataRangeNote =
                        "Current week until now";
            }

            case "MONTH" ->
            {
                fromDate =
                        today.withDayOfMonth(1);

                toDate =
                        today.withDayOfMonth(
                                today.lengthOfMonth()
                        );

                dataRangeNote =
                        "Current month until now";
            }

            case "YEAR" ->
            {
                fromDate =
                        today.withDayOfYear(1);

                toDate =
                        today.withDayOfYear(
                                today.lengthOfYear()
                        );

                dataRangeNote =
                        "Current year until now";
            }

            default -> throw new RuntimeException(
                    "Best selling period must be WEEK, MONTH or YEAR"
            );
        }

        if (toDate.isAfter(today))
        {
            toDate =
                    today;
        }

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                toDate.atTime(23, 59, 59);

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

        for (BestSellingDishProjection row : result)
        {

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
                dataRangeNote,
                items
        );
    }

    @Override
    public BestSellingReportResponse getBestSellingReport(
            LocalDate fromDate,
            LocalDate toDate
    )
    {

        LocalDate today =
                LocalDate.now();

        if (toDate.isAfter(today))
        {
            toDate =
                    today;
        }

        if (fromDate.isAfter(toDate))
        {
            throw new RuntimeException(
                    "fromDate must be before or equal to toDate"
            );
        }

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                toDate.atTime(23, 59, 59);

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

        int rank =
                1;

        for (BestSellingDishProjection row : result)
        {
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
                "Selected week range",
                items
        );
    }

    @Override
    public OrderShiftReportResponse getOrderShiftReport(String period)
    {

        LocalDate today =
                LocalDate.now();

        String normalizedPeriod =
                period == null
                        ? "WEEK"
                        : period.toUpperCase(Locale.ROOT);

        LocalDate fromDate;

        switch (normalizedPeriod)
        {
            case "WEEK" -> fromDate =
                    today.with(
                            TemporalAdjusters.previousOrSame(
                                    DayOfWeek.MONDAY
                            )
                    );

            case "YEAR" -> fromDate =
                    today.withDayOfYear(1);

            default -> throw new RuntimeException(
                    "Order shift period must be WEEK or YEAR"
            );
        }

        return getOrderShiftReport(
                fromDate,
                today
        );
    }

    @Override
    public OrderShiftReportResponse getOrderShiftReport(
            LocalDate fromDate,
            LocalDate toDate
    )
    {

        LocalDateTime now =
                LocalDateTime.now();

        LocalDate today =
                now.toLocalDate();

        if (toDate.isAfter(today))
        {
            toDate =
                    today;
        }

        if (fromDate.isAfter(toDate))
        {
            throw new RuntimeException(
                    "fromDate must be before or equal to toDate"
            );
        }

        LocalDateTime start =
                fromDate.atStartOfDay();

        LocalDateTime end =
                toDate.isEqual(today)
                        ? now
                        : toDate.atTime(23, 59, 59);

        List<LocalDateTime> paidOrderCreatedTimes =
                invoiceRepository.getPaidOrderCreatedTimesBetween(
                        start,
                        end
                );

        Map<OrderShift, Long> orderCountByShift =
                new EnumMap<>(OrderShift.class);

        for (OrderShift shift : OrderShift.values())
        {
            orderCountByShift.put(
                    shift,
                    0L
            );
        }

        for (LocalDateTime createdAt : paidOrderCreatedTimes)
        {
            OrderShift shift =
                    findOrderShift(
                            createdAt.toLocalTime()
                    );

            if (shift != null)
            {
                orderCountByShift.compute(
                        shift,
                        (key, value) -> value == null ? 1L : value + 1
                );
            }
        }

        long totalPaidOrders =
                paidOrderCreatedTimes.size();

        long days =
                ChronoUnit.DAYS.between(
                        fromDate,
                        toDate
                ) + 1;

        BigDecimal averageOrdersPerDay =
                BigDecimal.valueOf(totalPaidOrders)
                        .divide(
                                BigDecimal.valueOf(days),
                                1,
                                RoundingMode.HALF_UP
                        );

        OrderShift highestShift =
                findHighestOrderShift(
                        orderCountByShift
                );

        long highestShiftOrderCount =
                orderCountByShift.get(
                        highestShift
                );

        List<OrderShiftItemResponse> shifts =
                buildOrderShiftItems(
                        orderCountByShift,
                        totalPaidOrders
                );

        return new OrderShiftReportResponse(
                fromDate,
                toDate,
                totalPaidOrders,
                averageOrdersPerDay,
                new HighestOrderShiftResponse(
                        highestShift.shiftName,
                        highestShift.displayName,
                        highestShift.startTime,
                        highestShift.endTime,
                        highestShiftOrderCount,
                        calculatePercentage(
                                highestShiftOrderCount,
                                totalPaidOrders
                        )
                ),
                shifts
        );
    }

    private List<OrderShiftItemResponse> buildOrderShiftItems(
            Map<OrderShift, Long> orderCountByShift,
            long totalPaidOrders
    )
    {
        List<OrderShiftItemResponse> shifts =
                new ArrayList<>();

        for (OrderShift shift : OrderShift.values())
        {
            long orderCount =
                    orderCountByShift.get(
                            shift
                    );

            shifts.add(
                    new OrderShiftItemResponse(
                            shift.shiftName,
                            shift.displayName,
                            shift.startTime,
                            shift.endTime,
                            orderCount,
                            calculatePercentage(
                                    orderCount,
                                    totalPaidOrders
                            )
                    )
            );
        }

        return shifts;
    }

    private OrderShift findOrderShift(LocalTime time)
    {
        for (OrderShift shift : OrderShift.values())
        {
            if (shift.contains(time))
            {
                return shift;
            }
        }

        return null;
    }

    private OrderShift findHighestOrderShift(
            Map<OrderShift, Long> orderCountByShift
    )
    {
        OrderShift highestShift =
                OrderShift.MORNING;

        for (OrderShift shift : OrderShift.values())
        {
            if (orderCountByShift.get(shift) > orderCountByShift.get(highestShift))
            {
                highestShift =
                        shift;
            }
        }

        return highestShift;
    }

    private BigDecimal calculatePercentage(
            long orderCount,
            long totalPaidOrders
    )
    {
        if (totalPaidOrders == 0)
        {
            return BigDecimal.ZERO.setScale(
                    1,
                    RoundingMode.HALF_UP
            );
        }

        return BigDecimal.valueOf(orderCount)
                .multiply(
                        BigDecimal.valueOf(100)
                )
                .divide(
                        BigDecimal.valueOf(totalPaidOrders),
                        1,
                        RoundingMode.HALF_UP
                );
    }

    private String getDayLabel(DayOfWeek dayOfWeek)
    {
        return switch (dayOfWeek)
        {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private enum OrderShift
    {
        MORNING(
                "MORNING",
                "Ca sáng",
                LocalTime.of(8, 0),
                LocalTime.of(11, 0),
                "08:00",
                "10:59"
        ),
        NOON(
                "NOON",
                "Ca trưa",
                LocalTime.of(11, 0),
                LocalTime.of(14, 0),
                "11:00",
                "13:59"
        ),
        AFTERNOON(
                "AFTERNOON",
                "Ca chiều",
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "14:00",
                "16:59"
        ),
        EVENING(
                "EVENING",
                "Ca tối",
                LocalTime.of(17, 0),
                LocalTime.of(22, 1),
                "17:00",
                "22:00"
        );

        private final String shiftName;

        private final String displayName;

        private final LocalTime startInclusive;

        private final LocalTime endExclusive;

        private final String startTime;

        private final String endTime;

        OrderShift(
                String shiftName,
                String displayName,
                LocalTime startInclusive,
                LocalTime endExclusive,
                String startTime,
                String endTime
        )
        {
            this.shiftName =
                    shiftName;
            this.displayName =
                    displayName;
            this.startInclusive =
                    startInclusive;
            this.endExclusive =
                    endExclusive;
            this.startTime =
                    startTime;
            this.endTime =
                    endTime;
        }

        private boolean contains(LocalTime time)
        {
            return !time.isBefore(startInclusive)
                    && time.isBefore(endExclusive);
        }
    }
}
