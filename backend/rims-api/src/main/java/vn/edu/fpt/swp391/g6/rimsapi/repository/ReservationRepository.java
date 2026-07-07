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
            LocalDateTime end);

    Optional<Reservation> findFirstByTableIdAndStatus(int tableId, ReservationStatus status);


    // Lấy các reservation QUEUED sắp tới trong vòng 30 phút (để chuyển sang WAITING)
    // WHERE status = QUEUED AND reservation_time BETWEEN :from AND :to
    List<Reservation> findByStatusAndReservationTimeBetween(
            ReservationStatus status,
            LocalDateTime from,
            LocalDateTime to);

    // Lấy các reservation WAITING đã quá hạn (để tự hủy)
    // WHERE status = WAITING AND reservation_time < :deadline
    List<Reservation> findByStatusAndReservationTimeBefore(
            ReservationStatus status,
            LocalDateTime deadline);
}
