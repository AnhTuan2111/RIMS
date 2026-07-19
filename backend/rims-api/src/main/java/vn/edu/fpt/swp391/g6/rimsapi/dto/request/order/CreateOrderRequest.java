package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderRequest
{

    @NotNull()
    private Integer tableId;

    @NotEmpty()
    @Valid
    private List<OrderItemRequest> items;
}
