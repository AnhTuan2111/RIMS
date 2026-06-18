package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ChefDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishListResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

import java.util.List;


public interface ChefService
{

    List<KitchenOrderResponse> getKitchenOrders();

    DishDetailResponse getDishDetail(Long orderItemId);

    void updateDishStatus(Long orderItemId, OrderItemStatus status);
    List<DishListResponse> getDishList();
    void updateMenuStatus(
            Integer dishId,
            Boolean available);

    ChefDashboardResponse getDashboard();

    void requestCancel(Long orderItemId, String reason);

    List<KitchenOrderResponse> getCompletedOrders();
}