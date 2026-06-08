package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cashier")
@RequiredArgsConstructor
public class CashierController {

    private final CashierService cashierService;

    @GetMapping("/tables")
    public ResponseEntity<List<TableDashboardResponse>> getTablesDashboard() {
        return ResponseEntity.ok(cashierService.getTablesDashboard());
    }

    // API 2: Xem chi tiết hóa đơn bóc tách VAT từng món của bàn ăn
    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(cashierService.getOrderDetail(id));
    }

    // API 3: Tiến hành gọi cổng thanh toán (Nếu chọn QR_CODE sẽ sinh link VNPay)
    @PostMapping("/payments")
    public ResponseEntity<String> processPayment(@RequestBody PaymentRequest request, HttpServletRequest servletRequest) {
        String responseMessage = cashierService.processPayment(request, servletRequest);
        return ResponseEntity.ok(responseMessage);
    }

    // API 4: Điểm đón phản hồi tự động điều hướng từ VNPay về để chốt sổ DB
    @GetMapping("/payments/vnpay-callback")
    public ResponseEntity<String> vnpayCallback(@RequestParam Map<String, String> allParams) {
        String resultStatus = cashierService.handleVNPayCallback(allParams);
        return ResponseEntity.ok(resultStatus);
    }

}