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

    @NotBlank()
    @Size(max = 50 , message = "Tên không được vượt quá 50 kí tự")
    @Pattern(regexp = "^\\p{L}+( \\p{L}+)*$")
    private String customerName;

    @NotBlank()
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    @NotNull()
    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime reservationTime;

    @Size(max = 100, message = "Ghi chú không được vượt quá 100 ký tự")
    private String note;

    @NotNull()
    private Integer tableId;

    // Sẽ được set từ principal trong controller
    private Integer userId;
}