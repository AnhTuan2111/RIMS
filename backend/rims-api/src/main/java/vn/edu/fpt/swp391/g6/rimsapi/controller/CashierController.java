package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CashierController {

    private final CashierService cashierService;

    // API 1 xem danh sách 12 bàn
    @GetMapping("/cashier/tables")
    public ResponseEntity<List<TableDashboardResponse>> getTablesDashboard() {
        return ResponseEntity.ok(cashierService.getTablesDashboard());
    }

    // API 2 xem chi tiết từng bàn
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(cashierService.getOrderDetail(orderId));
    }
    //API 3 chọn method thanh toán
    @PostMapping("/orders/{id}/payment")
    public ResponseEntity<PaymentResponse> processPayment(
            @PathVariable Long id,
            @RequestBody PaymentRequest request
    ) {
        return ResponseEntity.ok(cashierService.processPayment(id, request));
    }

}