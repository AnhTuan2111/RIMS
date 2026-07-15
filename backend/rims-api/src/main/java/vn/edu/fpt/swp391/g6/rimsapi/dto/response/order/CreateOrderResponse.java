package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import lombok.*;

import java.math.BigDecimal;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderResponse
{
    private Long orderId;
    private String tableNumber;
    private String message;
    private BigDecimal totalAmount;
}
