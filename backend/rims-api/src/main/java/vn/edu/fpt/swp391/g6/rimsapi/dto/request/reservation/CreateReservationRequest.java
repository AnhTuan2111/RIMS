package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;


import jakarta.validation.constraints.*;
import lombok.*;

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

    @NotBlank
    @Min(1)
    @Max(12)
    private Integer tableId;

    @NotBlank
    private LocalDateTime reservationTime;
}
