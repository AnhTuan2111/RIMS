package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateMenuStatusRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.ChefService;
import org.springframework.web.bind.annotation.PathVariable;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishListResponse;
import java.util.List;

import org.springframework.web.bind.annotation.PutMapping;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu.UpdateDishStatusRequest;
import org.springframework.web.bind.annotation.RequestBody;


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
}