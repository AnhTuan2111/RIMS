package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

import java.util.List;


public interface ChefService
{

    List<KitchenOrderResponse> getKitchenOrders();

    DishDetailResponse getDishDetail(Long orderItemId);

    void updateDishStatus(Long orderItemId, OrderItemStatus status);

}