package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GroupedKitchenItemResponse {

    private Long orderItemId;

    private Long orderId;

    private String tableNumber;

    private Integer quantity;

    private LocalDateTime createdAt;
}