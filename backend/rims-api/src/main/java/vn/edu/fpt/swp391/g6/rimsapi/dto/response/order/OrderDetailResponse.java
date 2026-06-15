package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponse
{
    private Long orderId;
    private String tableName;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> orderItems;

    private BigDecimal totalAmountBeforeVat; // amount đầu
    private BigDecimal vatAmount;             // VAT 10%
    private BigDecimal finalAmount;           // tổng sau
}
