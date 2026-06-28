package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateOrderResponse
{
    private Long orderId;
    private String tableNumber;
    private String message;
    private List<String> itemSummary;
    private BigDecimal totalAmount;
}
