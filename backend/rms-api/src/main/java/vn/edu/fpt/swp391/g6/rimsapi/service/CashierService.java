package vn.edu.fpt.swp391.g6.rimsapi.service;

import jakarta.servlet.http.HttpServletRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import java.util.List;
import java.util.Map;

public interface CashierService {

    List<TableDashboardResponse> getTablesDashboard();
    OrderDetailResponse getOrderDetail(Long orderId);
    String processPayment(PaymentRequest request, HttpServletRequest servletRequest);
    String handleVNPayCallback(Map<String, String> queryParams);
}