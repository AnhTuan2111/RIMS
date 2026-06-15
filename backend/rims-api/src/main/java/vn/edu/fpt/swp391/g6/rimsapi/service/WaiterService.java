package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CreateOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.MenuItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.TableDetailResponse;

import java.util.List;


public interface WaiterService
{
    List<TableDetailResponse> getAllTables();

    CreateOrderResponse createOrder(CreateOrderRequest request, Integer waiterId);

    List<MenuItemResponse> getMenu();

    List<OrderDetailResponse> getServingOrders(int tableID);
}
