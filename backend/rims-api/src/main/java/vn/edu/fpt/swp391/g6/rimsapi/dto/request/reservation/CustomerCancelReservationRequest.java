package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CustomerCancelReservationRequest {

    @NotNull(message = "ID đặt bàn không được để trống")
    private Long reservationId;

    // ✅ Có thể giữ lại phone + reservationDate để validate thêm (optional)
    // @NotBlank(message = "Số điện thoại không được để trống")
    // @Pattern(regexp = "^[0-9]{10}$", message = "Số điện thoại phải là 10 chữ số")
    // private String phone;

    // @NotNull(message = "Vui lòng chọn ngày đặt cần hủy")
    // @DateTimeFormat(pattern = "yyyy-MM-dd")
    // private LocalDate reservationDate;
}