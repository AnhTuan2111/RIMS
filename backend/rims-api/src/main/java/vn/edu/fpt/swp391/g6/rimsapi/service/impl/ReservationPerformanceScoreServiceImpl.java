package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ReservationPerformanceScoreResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.ReservationPerformanceScoreRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.ReservationPerformanceScoreProjection;
import vn.edu.fpt.swp391.g6.rimsapi.service.ReservationPerformanceScoreService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationPerformanceScoreServiceImpl
        implements ReservationPerformanceScoreService {

    private final ReservationPerformanceScoreRepository reservationRepository;

    @Override
    public List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore(
            LocalDate fromDate,
            LocalDate toDate) {

        List<ReservationPerformanceScoreProjection> rows =
                reservationRepository.getReservationPerformanceScore(
                        fromDate.atStartOfDay(),
                        toDate.atTime(23, 59, 59)
                );

        long maxConfirm = 1;

        for (ReservationPerformanceScoreProjection row : rows) {
            if (row.getConfirmCount() > maxConfirm) {
                maxConfirm = row.getConfirmCount();
            }
        }

        List<ReservationPerformanceScoreResponse> result =
                new ArrayList<>();

        for (ReservationPerformanceScoreProjection row : rows) {

            long confirm = row.getConfirmCount();
            long cancelled = row.getCancelledCount();

            long total = confirm + cancelled;

            double successRate = 0;

            if (total > 0) {
                successRate = (confirm * 100.0) / total;
            }

            double volumeScore =
                    (confirm * 100.0) / maxConfirm;

            double performanceScore =
                    (volumeScore * 0.7)
                            + (successRate * 0.3);

            String performanceLevel;

            if (performanceScore >= 90) {
                performanceLevel = "Excellent";
            } else if (performanceScore >= 75) {
                performanceLevel = "Good";
            } else if (performanceScore >= 60) {
                performanceLevel = "Fair";
            } else {
                performanceLevel = "Poor";
            }

            ReservationPerformanceScoreResponse response =
                    new ReservationPerformanceScoreResponse(
                            getDayName(row.getDayOfWeek()),
                            confirm,
                            cancelled,
                            round(successRate),
                            round(performanceScore),
                            performanceLevel
                    );

            result.add(response);
        }

        return result;
    }

    private String getDayName(Integer day) {
        return switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 4 -> "Thursday";
            case 5 -> "Friday";
            case 6 -> "Saturday";
            case 7 -> "Sunday";
            default -> "Unknown";
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}