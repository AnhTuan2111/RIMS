package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueAnomalyResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.RevenueComparisonResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RevenueAlertStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RevenueReportServiceImplTest {

    private InvoiceRepository invoiceRepository;
    private RevenueReportServiceImpl revenueReportService;

    @BeforeEach
    void setUp() {

        invoiceRepository =
                mock(InvoiceRepository.class);

        revenueReportService =
                new RevenueReportServiceImpl(invoiceRepository);
    }

    @Test
    void detectRevenueAnomalyReturnsSpikeWhenRevenueIncreasesAboveThreshold() {

        LocalDate targetDate =
                LocalDate.now().minusDays(1);

        mockRevenue(
                targetDate,
                new BigDecimal("7000000"),
                new BigDecimal("31000000")
        );

        RevenueAnomalyResponse response =
                revenueReportService.detectRevenueAnomaly(
                        targetDate,
                        7,
                        new BigDecimal("30"),
                        new BigDecimal("30")
                );

        assertEquals(
                RevenueAlertStatus.SPIKE,
                response.getAlertStatus()
        );
        assertEquals(
                new BigDecimal("58.06"),
                response.getChangeRatePercent()
        );
    }

    @Test
    void detectRevenueAnomalyReturnsDropWhenRevenueDecreasesBelowThreshold() {

        LocalDate targetDate =
                LocalDate.now().minusDays(1);

        mockRevenue(
                targetDate,
                new BigDecimal("2500000"),
                new BigDecimal("31000000")
        );

        RevenueAnomalyResponse response =
                revenueReportService.detectRevenueAnomaly(
                        targetDate,
                        7,
                        new BigDecimal("30"),
                        new BigDecimal("30")
                );

        assertEquals(
                RevenueAlertStatus.DROP,
                response.getAlertStatus()
        );
        assertEquals(
                new BigDecimal("-43.55"),
                response.getChangeRatePercent()
        );
    }

    @Test
    void detectRevenueAnomalyReturnsNormalWhenRevenueIsWithinThresholds() {

        LocalDate targetDate =
                LocalDate.now().minusDays(1);

        mockRevenue(
                targetDate,
                new BigDecimal("4600000"),
                new BigDecimal("31000000")
        );

        RevenueAnomalyResponse response =
                revenueReportService.detectRevenueAnomaly(
                        targetDate,
                        7,
                        new BigDecimal("30"),
                        new BigDecimal("30")
                );

        assertEquals(
                RevenueAlertStatus.NORMAL,
                response.getAlertStatus()
        );
        assertEquals(
                new BigDecimal("3.87"),
                response.getChangeRatePercent()
        );
    }

    @Test
    void detectRevenueAnomalyReturnsNotEnoughDataWhenReferenceAverageIsZero() {

        LocalDate targetDate =
                LocalDate.now().minusDays(1);

        mockRevenue(
                targetDate,
                new BigDecimal("7000000"),
                BigDecimal.ZERO
        );

        RevenueAnomalyResponse response =
                revenueReportService.detectRevenueAnomaly(
                        targetDate,
                        7,
                        new BigDecimal("30"),
                        new BigDecimal("30")
                );

        assertEquals(
                RevenueAlertStatus.NOT_ENOUGH_DATA,
                response.getAlertStatus()
        );
        assertNull(
                response.getChangeRatePercent()
        );
    }

    @Test
    void compareRevenueThrowsWhenCurrentPeriodIsBeforePreviousPeriod() {

        LocalDate today =
                LocalDate.now();

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () -> revenueReportService.compareRevenue(
                                today.minusDays(13),
                                today.minusDays(7),
                                today.minusDays(6),
                                today
                        )
                );

        assertEquals(
                "The current period must be after the previous period",
                exception.getMessage()
        );
    }

    @Test
    void compareRevenueReturnsMessageWhenPreviousPeriodHasNoRevenue() {

        LocalDate today =
                LocalDate.now();

        LocalDate currentStartDate =
                today.minusDays(6);

        LocalDate currentEndDate =
                today;

        LocalDate previousStartDate =
                today.minusDays(13);

        LocalDate previousEndDate =
                today.minusDays(7);

        when(
                invoiceRepository.getRevenueBetween(
                        currentStartDate.atStartOfDay(),
                        currentEndDate.atTime(23, 59, 59)
                )
        ).thenReturn(new BigDecimal("5000000"));

        when(
                invoiceRepository.getRevenueBetween(
                        previousStartDate.atStartOfDay(),
                        previousEndDate.atTime(23, 59, 59)
                )
        ).thenReturn(BigDecimal.ZERO);

        RevenueComparisonResponse response =
                revenueReportService.compareRevenue(
                        currentStartDate,
                        currentEndDate,
                        previousStartDate,
                        previousEndDate
                );

        assertEquals(
                new BigDecimal("0.00"),
                response.getGrowthRate()
        );

        assertEquals(
                "Previous period has no revenue data",
                response.getMessage()
        );
    }

    @Test
    void compareRevenueCalculatesGrowthRateUsingBigDecimalRounding() {

        LocalDate today =
                LocalDate.now();

        LocalDate currentStartDate =
                today.minusDays(6);

        LocalDate currentEndDate =
                today;

        LocalDate previousStartDate =
                today.minusDays(13);

        LocalDate previousEndDate =
                today.minusDays(7);

        when(
                invoiceRepository.getRevenueBetween(
                        currentStartDate.atStartOfDay(),
                        currentEndDate.atTime(23, 59, 59)
                )
        ).thenReturn(new BigDecimal("5000001"));

        when(
                invoiceRepository.getRevenueBetween(
                        previousStartDate.atStartOfDay(),
                        previousEndDate.atTime(23, 59, 59)
                )
        ).thenReturn(new BigDecimal("3000000"));

        RevenueComparisonResponse response =
                revenueReportService.compareRevenue(
                        currentStartDate,
                        currentEndDate,
                        previousStartDate,
                        previousEndDate
                );

        assertEquals(
                new BigDecimal("66.67"),
                response.getGrowthRate()
        );
    }

    private void mockRevenue(
            LocalDate targetDate,
            BigDecimal currentRevenue,
            BigDecimal referenceRevenue
    ) {

        when(
                invoiceRepository.getRevenueBetween(
                        targetDate.atStartOfDay(),
                        targetDate.atTime(LocalTime.MAX)
                )
        ).thenReturn(currentRevenue);

        when(
                invoiceRepository.getRevenueBetween(
                        targetDate.minusDays(7).atStartOfDay(),
                        targetDate.minusDays(1).atTime(LocalTime.MAX)
                )
        ).thenReturn(referenceRevenue);
    }
}
