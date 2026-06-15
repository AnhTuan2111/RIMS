package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ReservationPerformanceScoreResponse;
import vn.edu.fpt.swp391.g6.rimsapi.repository.ReservationPerformanceScoreRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.ReservationPerformanceScoreProjection;
import vn.edu.fpt.swp391.g6.rimsapi.service.ReservationPerformanceScoreService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationPerformanceScoreServiceImpl
        implements ReservationPerformanceScoreService {

    private final ReservationPerformanceScoreRepository reservationRepository;

    @Override
    public List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore() {

        List<ReservationPerformanceScoreProjection> rows =
                reservationRepository.getReservationPerformanceScore();

        long maxConfirm =
                rows.stream()
                        .mapToLong(
                                ReservationPerformanceScoreProjection::getConfirmCount
                        )
                        .max()
                        .orElse(1);

        List<ReservationPerformanceScoreResponse> result =
                new ArrayList<>();

        for (ReservationPerformanceScoreProjection row : rows) {

            long confirm =
                    row.getConfirmCount();

            long cancelled =
                    row.getCancelledCount();

            long totalBookings =
                    confirm + cancelled;

            double successRate =
                    totalBookings == 0
                            ? 0
                            : (confirm * 100.0) / totalBookings;

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

            result.add(
                    new ReservationPerformanceScoreResponse(
                            getDayName(row.getDayOfWeek()),
                            confirm,
                            cancelled,
                            round(successRate),
                            round(performanceScore),
                            performanceLevel
                    )
            );
        }

        return result;
    }

    private String getDayName(Integer day) {

        return switch (day) {
            case 1 -> "Sunday";
            case 2 -> "Monday";
            case 3 -> "Tuesday";
            case 4 -> "Wednesday";
            case 5 -> "Thursday";
            case 6 -> "Friday";
            case 7 -> "Saturday";
            default -> "Unknown";
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}