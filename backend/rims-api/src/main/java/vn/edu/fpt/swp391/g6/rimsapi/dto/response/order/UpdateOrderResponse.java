package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateOrderResponse
{
    private Long orderId;
    private String tableNumber;
    private String message;
    private BigDecimal totalAmount;
}
