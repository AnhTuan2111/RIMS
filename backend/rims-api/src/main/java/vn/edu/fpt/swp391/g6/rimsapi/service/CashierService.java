package vn.edu.fpt.swp391.g6.rimsapi.service;


import vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.PaymentResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.VNPayResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.CashierInvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.PagedInvoiceResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;

import java.util.List;


public interface CashierService
{

    List<TableDashboardResponse> getTablesDashboard();

    OrderDetailResponse getOrderDetail(Long orderId);

    PaymentResponse processPayment(Long orderId, PaymentRequest request);

    void processVnPayFailed(String vnpTxnRef);

    PaymentResponse unlockOrder(Long orderId);

    PaymentResponse completeCashPayment(Long orderId, PaymentRequest request);

    VNPayResponse createVNPayPaymentUrl(Long orderId, Integer customerId, Integer pointsUsed);

    Long processVnPaySuccess(String vnpTxnRef);

    User searchCustomerByPhone(String phone);

    User createCustomerFast(String fullName, String phone, String email);

    PagedInvoiceResponse getTodayInvoices(String tableNumber, String keyword, String paymentMethod, String invoiceCode, int page, int size);

    CashierInvoiceDetailResponse getInvoiceDetailForCashier(Long invoiceId);
}