package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponse {
    private Long orderId;
    private String tableName;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> orderItems;

    // Thuế và dòng tiền tài chính
    private BigDecimal totalAmountBeforeVat; // Tiền món ăn gốc
    private BigDecimal vatAmount;             // Tiền thuế 10%
    private BigDecimal finalAmount;           // Tổng số tiền cuối cùng phải trả
}