package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.ReservationPerformanceScoreProjection;

import java.util.List;

public interface ReservationPerformanceScoreRepository
        extends JpaRepository<Reservation, Long> {

    @Query(value = """
        SELECT
            DATEPART(WEEKDAY, reservation_time) AS dayOfWeek,

            SUM(
                CASE
                    WHEN status = 'CONFIRMED'
                    THEN 1
                    ELSE 0
                END
            ) AS confirmCount,

            SUM(
                CASE
                    WHEN status = 'CANCELLED'
                    THEN 1
                    ELSE 0
                END
            ) AS cancelledCount

        FROM reservations

        GROUP BY DATEPART(WEEKDAY, reservation_time)

        ORDER BY DATEPART(WEEKDAY, reservation_time)
        """, nativeQuery = true)
    List<ReservationPerformanceScoreProjection>
    getReservationPerformanceScore();
}