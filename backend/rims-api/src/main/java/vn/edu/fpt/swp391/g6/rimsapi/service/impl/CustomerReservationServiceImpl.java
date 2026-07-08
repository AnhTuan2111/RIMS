// src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/impl/CustomerReservationServiceImpl.java

package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation.CustomerCreateReservationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.CustomerReservationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.GlobalExceptionHandler.BusinessException;
import vn.edu.fpt.swp391.g6.rimsapi.exception.GlobalExceptionHandler.ResourceNotFoundException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.ReservationRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CustomerReservationService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerReservationServiceImpl implements CustomerReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CustomerReservationResponse createReservation(CustomerCreateReservationRequest request) {
        log.info("Customer {} đặt bàn vào ngày: {}", request.getCustomerName(), request.getReservationTime());

        // 1. Kiểm tra userId có tồn tại
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));

        // 2. Kiểm tra ngày đặt không được ở quá khứ
        if (request.getReservationTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Không thể đặt bàn trong quá khứ");
        }

        // 3. Kiểm tra user đã đặt bàn trong ngày chưa
        LocalDate reservationDate = request.getReservationTime().toLocalDate();

        boolean userHasReservation = reservationRepository.existsActiveReservationByUserIdAndDate(
                request.getUserId(), reservationDate
        );

        if (userHasReservation) {
            throw new BusinessException("Bạn đã đặt bàn trong ngày " + reservationDate + " rồi! Mỗi khách hàng chỉ được đặt 1 bàn/ngày.");
        }

        // 4. Kiểm tra bàn tồn tại và còn trống
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + request.getTableId()));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new BusinessException("Bàn " + table.getTableNumber() + " hiện không khả dụng. Vui lòng chọn bàn khác.");
        }

        // 5. Kiểm tra bàn có bị trùng thời gian không
        LocalDateTime timeStart = request.getReservationTime().minusHours(1);
        LocalDateTime timeEnd = request.getReservationTime().plusHours(1);

        boolean tableReserved = reservationRepository.existsByTableIdAndReservationTimeBetween(
                request.getTableId(), timeStart, timeEnd
        );

        if (tableReserved) {
            throw new BusinessException("Bàn " + table.getTableNumber() + " đã được đặt trong khoảng thời gian này. Vui lòng chọn bàn hoặc thời gian khác.");
        }

        // 6. Tạo reservation mới
        Reservation reservation = new Reservation();
        reservation.setCustomerName(request.getCustomerName());
        reservation.setPhone(request.getPhone());
        reservation.setReservationTime(request.getReservationTime());
        reservation.setNote(request.getNote());
        reservation.setStatus(ReservationStatus.QUEUED);
        reservation.setTable(table);
        reservation.setUser(user);

        // 7. Cập nhật trạng thái bàn thành RESERVED
        table.setStatus(TableStatus.RESERVED);
        tableRepository.save(table);

        // 8. Lưu reservation
        Reservation savedReservation = reservationRepository.save(reservation);
        log.info("Customer {} đặt bàn thành công, ID: {}", request.getCustomerName(), savedReservation.getId());

        return convertToCustomerResponse(savedReservation);
    }

    @Override
    @Transactional
    public CustomerReservationResponse cancelCurrentReservation(Integer userId) {
        log.info("Customer ID: {} hủy đặt bàn hiện tại", userId);

        // 1. Kiểm tra user tồn tại
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId);
        }

        // 2. Tìm đặt bàn hiện tại của user
        List<Reservation> currentReservations = reservationRepository.findCurrentReservationsByUser(userId);

        if (currentReservations.isEmpty()) {
            throw new ResourceNotFoundException("Bạn không có đặt bàn nào đang hoạt động để hủy.");
        }

        // Lấy đặt bàn gần nhất
        Reservation reservation = currentReservations.get(0);

        // 3. Kiểm tra trạng thái - không cho hủy nếu đã COMPLETED
        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BusinessException("Không thể hủy đặt bàn đã hoàn thành.");
        }

        // 4. Kiểm tra đã quá giờ hủy chưa (chỉ áp dụng cho WAITING)
        if (reservation.getStatus() == ReservationStatus.WAITING) {
            LocalDateTime cancelDeadline = reservation.getReservationTime().plusMinutes(15);
            if (LocalDateTime.now().isAfter(cancelDeadline)) {
                throw new BusinessException("Đã quá thời gian cho phép hủy đặt bàn.");
            }
        }

        // 5. Trả bàn về trạng thái AVAILABLE
        RestaurantTable table = reservation.getTable();
        if (table.getStatus() == TableStatus.RESERVED) {
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        // 6. Cập nhật trạng thái reservation thành CANCELLED
        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation cancelledReservation = reservationRepository.save(reservation);

        log.info("Customer ID: {} hủy đặt bàn thành công, ID: {}", userId, cancelledReservation.getId());

        return convertToCustomerResponse(cancelledReservation);
    }

    @Override
    public boolean checkCustomerReservationByUser(Integer userId, String date) {
        try {
            log.info("Customer ID: {} kiểm tra đặt bàn ngày: {}", userId, date);

            LocalDate reservationDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);

            if (!userRepository.existsById(userId)) {
                return false;
            }

            return reservationRepository.existsActiveReservationByUserIdAndDate(userId, reservationDate);
        } catch (Exception e) {
            log.error("Error checking reservation: ", e);
            return false;
        }
    }

    @Override
    public CustomerReservationResponse getCurrentReservationByUser(Integer userId) {
        log.info("Customer ID: {} lấy đặt bàn hiện tại", userId);

        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId);
        }

        List<Reservation> currentReservations = reservationRepository.findCurrentReservationsByUser(userId);

        if (currentReservations.isEmpty()) {
            throw new ResourceNotFoundException("Bạn không có đặt bàn nào đang hoạt động.");
        }

        Reservation currentReservation = currentReservations.get(0);
        return convertToCustomerResponse(currentReservation);
    }

    // Phương thức chuyển đổi Entity sang Response
    private CustomerReservationResponse convertToCustomerResponse(Reservation reservation) {
        CustomerReservationResponse.CustomerReservationResponseBuilder builder =
                CustomerReservationResponse.builder()
                        .id(reservation.getId())
                        .customerName(reservation.getCustomerName())
                        .phone(reservation.getPhone())
                        .reservationTime(reservation.getReservationTime())
                        .note(reservation.getNote())
                        .status(reservation.getStatus())
                        .createdAt(reservation.getCreatedAt())
                        .updatedAt(reservation.getUpdatedAt());

        if (reservation.getTable() != null) {
            builder.tableNumber(reservation.getTable().getTableNumber())
                    .capacity(reservation.getTable().getCapacity())
                    .tableStatus(reservation.getTable().getStatus().name());
        }

        return builder.build();
    }
}