package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.order.CreateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.CreateOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.MenuItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDetailResponse;

import java.util.List;


public interface WaiterService
{
    List<TableDetailResponse> getAllTables();

    CreateOrderResponse createOrder(CreateOrderRequest request, Integer waiterId);

    List<MenuItemResponse> getMenu();

    List<OrderDetailResponse> getServingOrders(int tableID);
}
