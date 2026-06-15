package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.*;

import java.math.BigDecimal;


@Getter
@Data
public class PaymentResponse
{
    private String message;
    private boolean success;
    private Long invoiceId;

    private BigDecimal amountPaid;
    private BigDecimal excessAmount;
}