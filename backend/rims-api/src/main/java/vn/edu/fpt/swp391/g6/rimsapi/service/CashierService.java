package vn.edu.fpt.swp391.g6.rimsapi.service;


import vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.PaymentResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.VNPayResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDashboardResponse;

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