package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class CustomerCreateReservationRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 50, message = "Tên không được vượt quá 50 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10}$", message = "Số điện thoại phải là 10 chữ số")
    private String phone;

    @NotNull(message = "Thời gian đặt bàn không được để trống")
    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime reservationTime;

    private String note;

    @NotNull(message = "Vui lòng chọn bàn")
    private Integer tableId;

    // Sẽ được set từ principal trong controller
    private Integer userId;
}