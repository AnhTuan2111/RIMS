package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation.CustomerCreateReservationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.CustomerReservationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.RestaurantTableResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.GlobalExceptionHandler.ResourceNotFoundException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.ReservationRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CustomerReservationService;
import vn.edu.fpt.swp391.g6.rimsapi.util.ReservationConflictValidator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerReservationServiceImpl implements CustomerReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final ReservationConflictValidator conflictValidator;

    @Override
    @Transactional
    public CustomerReservationResponse createReservation(CustomerCreateReservationRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với ID: " + request.getUserId()));

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn với ID: " + request.getTableId()));

        if (request.getReservationTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Thời gian đặt bàn phải ở trong tương lai.");
        }

        LocalDateTime start = request.getReservationTime().minusMinutes(ReservationConflictValidator.TABLE_TURNAROUND_MINUTES);
        LocalDateTime end = request.getReservationTime().plusMinutes(ReservationConflictValidator.TABLE_TURNAROUND_MINUTES);

        List<Reservation> existingReservations = reservationRepository
                .findByTableIdAndReservationTimeBetween(request.getTableId(), start, end);

        if (conflictValidator.hasConflict(existingReservations, request.getReservationTime(), null)) {
            throw new IllegalArgumentException(
                    "Bàn đã được đặt trong khoảng thời gian này, các đơn phải cách nhau ít nhất 2.5 tiếng.");
        }

        Reservation reservation = new Reservation();
        reservation.setCustomerName(request.getCustomerName());
        reservation.setPhone(request.getPhone());
        reservation.setNote(request.getNote());
        reservation.setReservationTime(request.getReservationTime());
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.QUEUED);
        reservation.setUser(user);

        reservationRepository.save(reservation);

        return convertToCustomerResponse(reservation);
    }

    @Override
    @Transactional
    public CustomerReservationResponse cancelReservation(Integer userId, Long reservationId) {

        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId);
        }

        List<Reservation> currentReservations = reservationRepository.findCurrentReservationsByUser(userId);

        if (currentReservations.isEmpty()) {
            throw new ResourceNotFoundException("Bạn không có đặt bàn nào đang hoạt động để hủy.");
        }

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt bàn với ID: " + reservationId));

        if (reservation.getUser() == null || !reservation.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy đặt bàn này");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        return convertToCustomerResponse(reservation);
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
        CustomerReservationResponse.CustomerReservationResponseBuilder builder = CustomerReservationResponse.builder()
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

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTableResponse> getAvailableTables() {
        return tableRepository.findByStatus(TableStatus.AVAILABLE).stream()
                .map(t -> RestaurantTableResponse.builder()
                        .id(t.getId())
                        .tableNumber(t.getTableNumber())
                        .capacity(t.getCapacity())
                        .status(t.getStatus().name())
                        .build())
                .toList();
    }
}