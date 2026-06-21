package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;


@Getter
@Setter
public class UpdateDishStatusRequest
{
    @NotNull(message = "Trạng thái không được để trống")
    private OrderItemStatus status;
}
