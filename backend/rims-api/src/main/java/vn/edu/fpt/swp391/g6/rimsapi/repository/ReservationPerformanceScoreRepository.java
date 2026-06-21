package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.ReservationPerformanceScoreProjection;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationPerformanceScoreRepository
        extends JpaRepository<Reservation, Long> {

    @Query(value = """
        SELECT
            CASE
                WHEN DATEPART(WEEKDAY, reservation_time) = 1
                THEN 7
                ELSE DATEPART(WEEKDAY, reservation_time) - 1
            END AS dayOfWeek,

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

        WHERE reservation_time
              BETWEEN :startDate AND :endDate

        GROUP BY
            CASE
                WHEN DATEPART(WEEKDAY, reservation_time) = 1
                THEN 7
                ELSE DATEPART(WEEKDAY, reservation_time) - 1
            END

        ORDER BY dayOfWeek
        """, nativeQuery = true)
    List<ReservationPerformanceScoreProjection>
    getReservationPerformanceScore(
            LocalDateTime startDate,
            LocalDateTime endDate
    );
}