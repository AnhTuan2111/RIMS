package vn.edu.fpt.swp391.g6.rimsapi.service;


import vn.edu.fpt.swp391.g6.rimsapi.dto.request.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;

import java.util.List;


public interface CashierService
{

    List<TableDashboardResponse> getTablesDashboard();

    OrderDetailResponse getOrderDetail(Long orderId);

    PaymentResponse processPayment(Long orderId, PaymentRequest request);

    PaymentResponse completeCashPayment(Long orderId, PaymentRequest request);

    VNPayResponse createVNPayPaymentUrl(Long orderId);

    Long processVnPaySuccess(String vnpTxnRef);
}