package vn.edu.fpt.swp391.g6.rimsapi.repository.projection;


public interface ReservationPerformanceScoreProjection {

    Integer getDayOfWeek();

    Long getConfirmCount();

    Long getCancelledCount();
}