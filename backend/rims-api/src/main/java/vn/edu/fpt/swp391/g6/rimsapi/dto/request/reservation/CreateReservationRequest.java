package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;


import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CreateReservationRequest
{
    @NotBlank
    @Size(max = 50)
    @Pattern(regexp = "^\\p{L}+(?: \\p{L}+)*$")
    private String customerName;

    @NotBlank
    @Pattern(regexp = "^0[0-9]{9}$")
    private String phone;

    @Size(max = 255)
    private String note;

    @NotNull
    @Min(1)
    @Max(12)
    private Integer tableId;

    @NotNull
    private LocalDateTime reservationTime;
}
