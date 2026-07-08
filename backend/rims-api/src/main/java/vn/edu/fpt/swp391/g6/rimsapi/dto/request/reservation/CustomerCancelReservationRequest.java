package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class CustomerCancelReservationRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10}$", message = "Số điện thoại phải là 10 chữ số")
    private String phone;

    @NotNull(message = "Vui lòng chọn ngày đặt cần hủy")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate reservationDate;
}