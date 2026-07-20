package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateOrderItemRequest
{
    private Long orderItemId; // null nếu là món mới, còn món cũ sẽ được gửi kèm id

    @NotNull()
    private Integer dishId;

    @NotNull()
    @PositiveOrZero
    private Integer quantity;

    private String note;
}
