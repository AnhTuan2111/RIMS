package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ReservationPerformanceScoreResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.ReservationPerformanceScoreService;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationPerformanceScoreController {

    private final ReservationPerformanceScoreService reservationPerformanceScoreService;

    @GetMapping("/performance-score")
    public List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore() {

        return reservationPerformanceScoreService
                .getReservationPerformanceScore();
    }
}
