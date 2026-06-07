package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.Getter;
import lombok.Setter;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

@Getter
@Setter
public class DishDetailResponse {

    private Long orderItemId;

    private String dishName;

    private String description;

    private Integer quantity;

    private String note;

    private OrderItemStatus status;
}