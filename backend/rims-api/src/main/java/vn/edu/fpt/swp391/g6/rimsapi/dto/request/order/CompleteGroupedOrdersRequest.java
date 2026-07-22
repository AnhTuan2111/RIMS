package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
public class CompleteGroupedOrdersRequest
{
    @NotEmpty(message = "Danh sách món không được để trống")
    private List<@NotNull(message = "ID món không được để trống") Long> orderItemIds;
}