package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.*;

import java.math.BigDecimal;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemResponse
{
    private Long orderItemId;
    private String dishName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subTotal;
    private String note;
}