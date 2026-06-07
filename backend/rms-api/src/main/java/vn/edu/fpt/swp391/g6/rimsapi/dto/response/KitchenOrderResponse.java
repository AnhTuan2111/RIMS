package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KitchenOrderResponse {

    private Long orderItemId;

    private Long orderId;

    private String tableNumber;

    private String dishName;

    private Integer quantity;

    private OrderItemStatus status;
}