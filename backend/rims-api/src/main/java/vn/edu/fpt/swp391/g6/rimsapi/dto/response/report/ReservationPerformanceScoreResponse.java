package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReservationPerformanceScoreResponse {

    private String day;

    private Long confirm;

    private Long cancelled;

    private double successRate;

    private double performanceScore;

    private String performanceLevel;
}