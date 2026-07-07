package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>
{
    List<Reservation> findByTableIdAndReservationTimeBetween(
            int tableId,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<Reservation> findFirstByTableIdAndStatus(int tableId, ReservationStatus status);
}
