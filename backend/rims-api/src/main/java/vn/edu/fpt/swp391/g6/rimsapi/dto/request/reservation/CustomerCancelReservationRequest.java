package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class CustomerCancelReservationRequest {

    @NotBlank()
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    @NotNull()
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate reservationDate;
}