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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerReservationServiceImpl implements CustomerReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;

    // Thời gian ăn mặc định + buffer dọn bàn — dùng để tính overlap (lỗi #3)
    private static final int DEFAULT_DURATION_MINUTES = 90;
    private static final int BUFFER_MINUTES = 20;
    private static final int TOTAL_SLOT_MINUTES = DEFAULT_DURATION_MINUTES + BUFFER_MINUTES;

    // Giới hạn đặt trước (lỗi #6)
    private static final int MIN_ADVANCE_MINUTES = 30;
    private static final int MAX_ADVANCE_DAYS = 30;

    @Override
    @Transactional
    public CustomerReservationResponse createReservation(CustomerCreateReservationRequest request) {
        log.info("Customer {} đặt bàn vào ngày: {}", request.getCustomerName(), request.getReservationTime());

        // 1. Kiểm tra userId có tồn tại
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));

        // 2. Kiểm tra giới hạn đặt trước tối thiểu/tối đa (lỗi #6)
        // Check giá rẻ (không đụng DB) nên làm trước, fail sớm trước khi lock/query
        LocalDateTime now = LocalDateTime.now();
        long minutesUntilReservation = Duration.between(now, request.getReservationTime()).toMinutes();

        if (minutesUntilReservation < 0) {
            throw new BusinessException("Không thể đặt bàn trong quá khứ");
        }
        if (minutesUntilReservation < MIN_ADVANCE_MINUTES) {
            throw new BusinessException("Vui lòng đặt bàn trước ít nhất " + MIN_ADVANCE_MINUTES + " phút.");
        }
        if (minutesUntilReservation > (long) MAX_ADVANCE_DAYS * 24 * 60) {
            throw new BusinessException("Chỉ được đặt bàn trước tối đa " + MAX_ADVANCE_DAYS + " ngày.");
        }

        // 3. Kiểm tra user đã đặt bàn trong ngày chưa
        LocalDate reservationDate = request.getReservationTime().toLocalDate();

        boolean userHasReservation = reservationRepository.existsActiveReservationByUserIdAndDate(
                request.getUserId(), reservationDate
        );

        if (userHasReservation) {
            throw new BusinessException("Bạn đã đặt bàn trong ngày " + reservationDate + " rồi! Mỗi khách hàng chỉ được đặt 1 bàn/ngày.");
        }

        // 4. Lock bàn TRƯỚC khi check overlap (lỗi #1 — chống race condition)
        // Request thứ 2 gọi findByIdForUpdate cho cùng tableId sẽ phải CHỜ tới khi
        // transaction này commit/rollback, nên không thể có 2 request cùng "lọt qua" bước check bên dưới
        RestaurantTable table = tableRepository.findByIdForUpdate(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + request.getTableId()));

        // Bỏ check table.getStatus() != AVAILABLE ở đây (lỗi #2):
        // table.status không còn dùng để chặn theo khung giờ nữa — xem giải thích ở bước 7.
        // TableStatus thực tế chỉ có AVAILABLE/RESERVED/SERVING, không có giá trị "khoá vĩnh viễn"
        // (MAINTENANCE) nào cả, nên không có gì để chặn ở bước này — overlap-check ở bước 5
        // là điều kiện DUY NHẤT quyết định bàn có đặt được cho khung giờ này hay không.

        // 5. Kiểm tra overlap có tính buffer time, chỉ tính reservation còn "sống" (lỗi #3, #4)
        LocalDateTime newStart = request.getReservationTime();
        LocalDateTime newEnd = newStart.plusMinutes(DEFAULT_DURATION_MINUTES);

        List<Reservation> activeReservations = reservationRepository.findActiveReservationsByTableId(request.getTableId());

        boolean hasConflict = activeReservations.stream().anyMatch(existing -> {
            LocalDateTime existingEnd = existing.getReservationTime().plusMinutes(TOTAL_SLOT_MINUTES);
            // Công thức overlap chuẩn: newStart < existingEnd AND newEnd > existingStart
            return newStart.isBefore(existingEnd) && newEnd.isAfter(existing.getReservationTime());
        });

        if (hasConflict) {
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

        // 7. KHÔNG set table.status = RESERVED nữa (lỗi #2)
        // Lý do: table.status là trạng thái vật lý của bàn tại MỌI thời điểm, còn 1 reservation
        // chỉ chiếm bàn trong 1 khung giờ cụ thể. Nếu set RESERVED ở đây thì bàn bị khoá AVAILABLE
        // cho toàn bộ tương lai, không đặt được cho khung giờ khác dù thực tế vẫn trống.
        // Việc "bàn có trống hay không tại giờ X" giờ hoàn toàn dựa vào bước check overlap ở bước 5,
        // không dựa vào table.status nữa. table.status chỉ dùng cho case bảo trì/khoá vĩnh viễn.

        // 8. Lưu reservation — vẫn nằm trong cùng transaction với bước lock + check overlap ở trên
        Reservation savedReservation = reservationRepository.save(reservation);
        log.info("Customer {} đặt bàn thành công, ID: {}", request.getCustomerName(), savedReservation.getId());

        return convertToCustomerResponse(savedReservation);
    }

    @Override
    @Transactional
    public CustomerReservationResponse cancelReservation(Integer userId, Long reservationId) {
        log.info("Customer ID: {} hủy đặt bàn ID: {}", userId, reservationId);

        // 1. Kiểm tra user tồn tại
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId);
        }

        // 2. Lấy ĐÚNG reservation user muốn hủy, đồng thời check ownership trong 1 query (lỗi #5)
        // Không dùng findCurrentReservationsByUser(userId).get(0) nữa vì nếu user có nhiều
        // active reservation (khác ngày), .get(0) có thể hủy nhầm cái user không định hủy
        Reservation reservation = reservationRepository.findByIdAndUserId(reservationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đặt bàn ID " + reservationId + " thuộc về bạn."));

        // 3. Kiểm tra trạng thái - không cho hủy nếu đã COMPLETED hoặc đã CANCELLED trước đó
        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BusinessException("Không thể hủy đặt bàn đã hoàn thành.");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Đặt bàn này đã được hủy trước đó.");
        }

        // 4. Kiểm tra đã quá giờ hủy chưa (chỉ áp dụng cho WAITING)
        if (reservation.getStatus() == ReservationStatus.WAITING) {
            LocalDateTime cancelDeadline = reservation.getReservationTime().plusMinutes(15);
            if (LocalDateTime.now().isAfter(cancelDeadline)) {
                throw new BusinessException("Đã quá thời gian cho phép hủy đặt bàn.");
            }
        }

        RestaurantTable table = reservation.getTable();

        // 5. Trả bàn về AVAILABLE nếu nó đang bị đánh dấu RESERVED thủ công (trường hợp legacy)
        if (table != null && table.getStatus() == TableStatus.RESERVED) {
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        // 6. Cập nhật trạng thái reservation thành CANCELLED
        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation cancelledReservation = reservationRepository.save(reservation);

        log.info("Customer ID: {} hủy đặt bàn thành công, ID: {}", userId, cancelledReservation.getId());

        // 7. Promote 1 reservation QUEUED khác đang chờ đúng bàn này lên WAITING (lỗi #7)
        // Vì slot vừa được giải phóng, ai đang QUEUED lâu nhất cho bàn này được ưu tiên trước
        if (table != null) {
            promoteQueuedReservation(table.getId());
        }

        return convertToCustomerResponse(cancelledReservation);
    }

    // Tìm reservation QUEUED cũ nhất cho 1 bàn và promote lên WAITING sau khi có slot trống (lỗi #7)
    private void promoteQueuedReservation(Integer tableId) {
        List<Reservation> queuedReservations = reservationRepository
                .findByTableIdAndStatusOrderByCreatedAtAsc(tableId, ReservationStatus.QUEUED);

        if (queuedReservations.isEmpty()) {
            return;
        }

        Reservation nextInLine = queuedReservations.get(0);
        nextInLine.setStatus(ReservationStatus.WAITING);
        reservationRepository.save(nextInLine);

        log.info("Promote reservation ID: {} từ QUEUED sang WAITING sau khi bàn {} được giải phóng",
                nextInLine.getId(), tableId);

        // TODO: gửi notification/email cho khách hàng của nextInLine báo đã có bàn
    }

    @Override
    public boolean checkCustomerReservationByUser(Integer userId, String date) {
        log.info("Customer ID: {} kiểm tra đặt bàn ngày: {}", userId, date);

        // Lỗi #8: không còn catch Exception rồi trả false cho mọi trường hợp nữa.
        // Parse sai format, user không tồn tại, và "user tồn tại nhưng không có reservation"
        // giờ là 3 nhánh khác nhau — lỗi hệ thống/input sai sẽ throw ra ngoài để GlobalExceptionHandler
        // trả đúng mã lỗi (400/404), không bị nuốt thành "false" như thể đó là câu trả lời nghiệp vụ hợp lệ.
        LocalDate reservationDate;
        try {
            reservationDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            throw new BusinessException("Định dạng ngày không hợp lệ, yêu cầu yyyy-MM-dd: " + date);
        }

        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId);
        }

        return reservationRepository.existsActiveReservationByUserIdAndDate(userId, reservationDate);
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