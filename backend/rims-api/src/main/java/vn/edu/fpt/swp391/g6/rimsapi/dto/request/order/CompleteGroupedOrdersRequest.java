package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CompleteGroupedOrdersRequest {

    @NotEmpty(message = "orderItemIds must not be empty")
    private List<Long> orderItemIds;
}

