package vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;


@Getter
@Setter
public class PaymentRequest
{
    @NotNull()
    private PaymentMethod paymentMethod;

    @NotNull()
    @PositiveOrZero()
    private Double amountPaid;

    private Integer customerId; // Ai đang thanh toán (Có thể null nếu khách không có tài khoản)

    @PositiveOrZero()
    private Integer pointsUsed = 0;
}
