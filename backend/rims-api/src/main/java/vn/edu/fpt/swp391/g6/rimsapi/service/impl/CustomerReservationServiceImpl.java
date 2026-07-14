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
import java.util.Locale;


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

        if (userRepository.findById(request.getUserId()).isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId());
        }

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn với ID: " + request.getTableId()));

        if (request.getReservationTime().isBefore(LocalDateTime.now()))
        {
            throw new IllegalArgumentException("Thời gian đặt bàn phải ở trong tương lai.");
        }

        LocalDateTime start = request.getReservationTime().minusMinutes(150);
        LocalDateTime end = request.getReservationTime().plusMinutes(150);

        List<Reservation> existingReservations = reservationRepository.findByTableIdAndReservationTimeBetween(request.getTableId(), start, end);

        for (Reservation res : existingReservations)
        {
            if (res.getStatus() != ReservationStatus.CANCELLED)
            {
                if (res.getReservationTime().isAfter(start) && res.getReservationTime().isBefore(end))
                {
                    throw new IllegalArgumentException("Bàn đã được đặt trong khoảng thời gian này, các đơn phải cách nhau ít nhất 2.5 tiếng.");
                }
            }
        }

        Reservation reservation = new Reservation();
        reservation.setCustomerName(request.getCustomerName());
        reservation.setPhone(request.getPhone());
        reservation.setNote(request.getNote());
        reservation.setReservationTime(request.getReservationTime());
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.QUEUED);

        reservationRepository.save(reservation);

        return convertToCustomerResponse(reservation);
    }

    @Override
    @Transactional
    public CustomerReservationResponse cancelCurrentReservation(Integer userId) {

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


        RestaurantTable table = reservation.getTable();
        if (table.getStatus() == TableStatus.RESERVED) {
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        // 6. Cập nhật trạng thái reservation thành CANCELLED
        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation cancelledReservation = reservationRepository.save(reservation);

        return convertToCustomerResponse(cancelledReservation);
    }

    @Override
    public boolean checkCustomerReservationByUser(Integer userId, String date) {
        try {

            LocalDate reservationDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
            if (!userRepository.existsById(userId)) {
                return false;
            }

            return reservationRepository.existsActiveReservationByUserIdAndDate(userId, reservationDate);
        } catch (Exception e) {
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