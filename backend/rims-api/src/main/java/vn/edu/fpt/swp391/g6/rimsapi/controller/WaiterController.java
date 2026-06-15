package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.MenuItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.CreateOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.service.WaiterService;

import java.util.List;


@RestController
@RequestMapping("/rims/waiter")
@RequiredArgsConstructor
public class WaiterController
{
    private final WaiterService waiterService;

    @GetMapping("/tables")
    public ResponseEntity<List<TableDetailResponse>> getWaiterTables()
    {
        return ResponseEntity.ok(waiterService.getAllTables());
    }

    @PostMapping("/orders")
    public ResponseEntity<CreateOrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal)
    {
        CreateOrderResponse response = waiterService.createOrder(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemResponse>> getMenu()
    {
        return ResponseEntity.ok(waiterService.getMenu());
    }
}

