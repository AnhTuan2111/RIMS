package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ReservationPerformanceScoreResponse;

import java.util.List;

public interface ReservationPerformanceScoreService {

    List<ReservationPerformanceScoreResponse>
    getReservationPerformanceScore();
}
