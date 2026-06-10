package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.ChefService;
import org.springframework.web.bind.annotation.PathVariable;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishDetailResponse;
import java.util.List;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateDishStatusRequest;
import org.springframework.web.bind.annotation.RequestBody;
@RestController
@RequestMapping("/api/chef")
@RequiredArgsConstructor
public class ChefController {

    private final ChefService chefService;

    @GetMapping("/orders")
    public List<KitchenOrderResponse> getOrders() {

        return chefService.getKitchenOrders();
    }
    @GetMapping("/orders/{id}")
    public DishDetailResponse getDishDetail(
            @PathVariable Long id) {

        return chefService.getDishDetail(id);
    }
    @PutMapping("/orders/{id}/status")
    public String updateDishStatus(
            @PathVariable Long id,
            @RequestBody UpdateDishStatusRequest request) {

        chefService.updateDishStatus(
                id,
                request.getStatus());

        return "Status updated successfully";
    }
}