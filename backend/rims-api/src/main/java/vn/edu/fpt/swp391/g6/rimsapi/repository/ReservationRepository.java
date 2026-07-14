package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;

import java.time.LocalDate;
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

    // Kiểm tra số điện thoại đã đặt bàn trong ngày chưa
    boolean existsByPhoneAndReservationTimeBetween(String phone, LocalDateTime start, LocalDateTime end);

    // Lấy các reservation còn "sống" (chưa CANCELLED/COMPLETED) của 1 bàn để service tự tính overlap
    // Tính existingEnd = reservationTime + duration + buffer ở tầng Java để không phụ thuộc cú pháp
    // DATE_ADD/DATEADD riêng của từng loại DB (MySQL vs SQL Server khác nhau)
    @Query("SELECT r FROM Reservation r WHERE r.table.id = :tableId AND r.status NOT IN ('CANCELLED', 'COMPLETED')")
    List<Reservation> findActiveReservationsByTableId(@Param("tableId") Integer tableId);

    // Tìm reservation QUEUED cho 1 bàn cụ thể, sắp theo thời gian tạo (ai đặt trước được ưu tiên)
    List<Reservation> findByTableIdAndStatusOrderByCreatedAtAsc(Integer tableId, ReservationStatus status);

    // Tìm reservation theo phone và ngày
    Optional<Reservation> findByPhoneAndReservationTimeBetween(String phone, LocalDateTime start, LocalDateTime end);

    // Tìm tất cả reservation theo phone
    List<Reservation> findByPhone(String phone);

    // ====== NEW METHODS FOR USER ======

    // Kiểm tra user đã đặt bàn trong ngày chưa
    @Query("SELECT COUNT(r) > 0 FROM Reservation r WHERE r.user.id = :userId AND CAST(r.reservationTime AS date) = :date")
    boolean existsByUserIdAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);


    // Tìm reservation của user trong ngày
    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND CAST(r.reservationTime AS date) = :date")
    Optional<Reservation> findByUserIdAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);

    // Tìm tất cả reservation của user
    List<Reservation> findByUserIdOrderByReservationTimeDesc(Integer userId);

    // Tìm reservation của user theo ID (kiểm tra quyền)
    @Query("SELECT r FROM Reservation r WHERE r.id = :reservationId AND r.user.id = :userId")
    Optional<Reservation> findByIdAndUserId(@Param("reservationId") Long reservationId, @Param("userId") Integer userId);

    // Tìm reservation hiện tại của user (chưa COMPLETED hoặc CANCELLED)
    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY r.reservationTime DESC")
    List<Reservation> findCurrentReservationsByUser(@Param("userId") Integer userId);

    // Kiểm tra user đã đặt bàn trong ngày và chưa COMPLETED/CANCELLED
    @Query("SELECT COUNT(r) > 0 FROM Reservation r WHERE r.user.id = :userId AND CAST(r.reservationTime AS date) = :date AND r.status NOT IN ('COMPLETED', 'CANCELLED')")
    boolean existsActiveReservationByUserIdAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);

}