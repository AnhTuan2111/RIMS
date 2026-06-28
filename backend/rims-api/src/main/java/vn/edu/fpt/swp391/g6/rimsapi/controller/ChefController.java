package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.CancelDishRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateDishStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateMenuStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.ChefDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishListResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.ChefService;

import java.util.List;


@RestController
@RequestMapping("/rims/chef")
@RequiredArgsConstructor
public class ChefController
{
    private final ChefService chefService;

    @GetMapping("/orders")
    public List<KitchenOrderResponse> getOrders()
    {
        return chefService.getKitchenOrders();
    }

    @GetMapping("/orders/{id}")
    public DishDetailResponse getDishDetail(@PathVariable Long id)
    {
        return chefService.getDishDetail(id);
    }

    @PutMapping("/orders/{id}/status")
    public String updateDishStatus(@PathVariable Long id, @RequestBody UpdateDishStatusRequest request)
    {
        chefService.updateDishStatus(id, request.getStatus());
        return "Status updated successfully";
    }
    @GetMapping("/dishes")
    public List<DishListResponse> getDishList()
    {
        return chefService.getDishList();
    }
    @PutMapping("/dishes/{id}/status")
    public String updateMenuStatus(
            @PathVariable Integer id,
            @RequestBody UpdateMenuStatusRequest request)
    {
        chefService.updateMenuStatus(
                id,
                request.getAvailable());

        return "Menu status updated successfully";
    }
    @GetMapping("/dashboard")
    public ChefDashboardResponse getDashboard()
    {
        return chefService.getDashboard();
    }
    @GetMapping("/orders/completed")
    public List<KitchenOrderResponse> getCompletedOrders()
    {
        return chefService.getCompletedOrders();
    }
    @PostMapping("/orders/{id}/cancel-request")
    public String requestCancelDish(@PathVariable Long id, @RequestBody CancelDishRequest request)
    {
        chefService.requestCancel(id, request.getReason());
        return "Cancel request sent successfully";
    }
}