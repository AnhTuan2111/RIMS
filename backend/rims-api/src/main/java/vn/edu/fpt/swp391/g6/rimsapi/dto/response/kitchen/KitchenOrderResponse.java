package vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen;

import lombok.Getter;
import lombok.Setter;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

import java.time.LocalDateTime;


@Getter
@Setter
public class KitchenOrderResponse
{

    private Long orderItemId;

    private Long orderId;

    private String tableNumber;

    private String dishName;

    private Integer quantity;

    private OrderItemStatus status;
    private LocalDateTime createdAt;
}
