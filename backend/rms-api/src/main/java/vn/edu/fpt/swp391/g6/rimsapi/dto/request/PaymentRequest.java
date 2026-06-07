package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import lombok.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequest {
    private Long orderId;
    private PaymentMethod paymentMethod;
}