package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ReservationPerformanceScoreResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReservationPerformanceScoreService {

    List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore(
            LocalDate fromDate,
            LocalDate toDate
    );
}