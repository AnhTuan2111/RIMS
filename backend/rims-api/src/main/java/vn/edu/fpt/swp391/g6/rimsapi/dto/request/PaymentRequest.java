package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class PaymentRequest
{
    private String paymentMethod;

    public String getPaymentMethod()
    {
        return paymentMethod;
    }
}