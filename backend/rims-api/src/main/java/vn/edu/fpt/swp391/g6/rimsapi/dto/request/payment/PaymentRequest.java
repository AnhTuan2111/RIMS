package vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment;

import lombok.Getter;
import lombok.Setter;
import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;


@Getter
@Setter
public class PaymentRequest
{
    private PaymentMethod paymentMethod;
    private Double amountPaid;
}
