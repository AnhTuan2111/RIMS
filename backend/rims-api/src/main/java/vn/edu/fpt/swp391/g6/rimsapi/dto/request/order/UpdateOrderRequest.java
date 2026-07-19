package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateOrderRequest
{
    @NotEmpty()
    @Valid
    private List<UpdateOrderItemRequest> items;
}
