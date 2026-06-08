package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.config.VNPayConfig;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TableDashboardResponse> getTablesDashboard() {
        // 1. Lấy tất cả 12 bàn ăn từ database
        List<RestaurantTable> tables = tableRepository.findAll();

        // 2. Lấy tất cả các đơn hàng đang phục vụ (SERVING)
        List<Order> activeOrders = orderRepository.findByStatus(OrderStatus.SERVING);

        // Tạo bản đồ (Map) giữa Table ID và Order ID đang ăn
        Map<Integer, Long> tableOrderMap = activeOrders.stream()
                .filter(o -> o.getTable() != null)
                .collect(Collectors.toMap(
                        o -> o.getTable().getId(),
                        Order::getOrderId,
                        (existing, replacement) -> existing
                ));

        // 3. Duyệt qua các bàn và ép trạng thái theo chuẩn nghiệp vụ của Cashier
        return tables.stream()
                .map(t -> {
                    Long orderId = tableOrderMap.get(t.getId());

                    TableStatus cashierStatus = (orderId != null) ? TableStatus.SERVING : TableStatus.AVAILABLE;

                    return TableDashboardResponse.builder()
                            .tableId(t.getId())
                            .tableNumber(t.getTableNumber())
                            .status(cashierStatus)
                            .orderId(orderId)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(Long orderId) {
        Order order = orderRepository.findOrderWithDetailsById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng tương ứng"));

        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(oi -> OrderItemResponse.builder()
                        .orderItemId(oi.getOrderItemId())
                        .dishName(oi.getDish() != null ? oi.getDish().getName() : "Món ăn không xác định")
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .subTotal(oi.getSubTotal())
                        .note(oi.getNote())
                        .build())
                .collect(Collectors.toList());

        // Tính toán tài chính có VAT 10%
        BigDecimal totalBeforeVat = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        return OrderDetailResponse.builder()
                .orderId(order.getOrderId())
                .tableName(order.getTable() != null ? order.getTable().getTableNumber() : "N/A")
                .createdAt(order.getCreatedAt())
                .orderItems(itemResponses)
                .totalAmountBeforeVat(totalBeforeVat)
                .vatAmount(vatAmount)
                .finalAmount(finalAmount)
                .build();
    }

    @Override
    @Transactional
    public String processPayment(PaymentRequest request, HttpServletRequest servletRequest) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            return "Đơn hàng này đã được thanh toán rồi!";
        }
        

        BigDecimal finalAmount = order.getTotalAmount().multiply(new BigDecimal("1.10")); // Cộng 10% VAT

        // TH 1: THANH TOÁN TIỀN MẶT (CASH)
        if (request.getPaymentMethod() == PaymentMethod.CASH) {
            // Đồng bộ cập nhật trạng thái thực thể
            order.setStatus(OrderStatus.COMPLETED);
            if (order.getTable() != null) {
                order.getTable().setStatus(TableStatus.AVAILABLE); // Đổi về EMPTY theo cấu hình của bạn
            }
            orderRepository.save(order);

            Invoice invoice = new Invoice();
            invoice.setInvoiceDate(LocalDateTime.now());
            invoice.setFinalAmount(finalAmount);
            order.setInvoice(invoice);
            invoiceRepository.save(invoice);

            Payment payment = new Payment();
            payment.setAmount(finalAmount);
            payment.setSuccess(true);
            invoice.addPayment(payment);
            paymentRepository.save(payment);

            return "Thanh toán tiền mặt thành công!";
        }

        // TH 2: TẠO ĐƯỜNG LINK THANH TOÁN QR_CODE VNPAY
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VNPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VNPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", VNPayConfig.vnp_TmnCode);

        // VNPay yêu cầu số tiền nhân 100
        long amountToSend = finalAmount.multiply(new BigDecimal("100")).longValue();
        vnp_Params.put("vnp_Amount", String.valueOf(amountToSend));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", String.valueOf(order.getOrderId()));
        vnp_Params.put("vnp_OrderInfo", "Thanh toan hoa don ban: " + (order.getTable() != null ? order.getTable().getTableNumber() : order.getOrderId()));
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(servletRequest));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", formatter.format(LocalDateTime.now()));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        StringBuilder hashData = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append('&');
                hashData.append('&');
            }
        }
        if (query.length() > 0) {
            query.setLength(query.length() - 1);
            hashData.setLength(hashData.length() - 1);
        }

        String vnp_SecureHash = VNPayConfig.hmacSHA512(VNPayConfig.vnp_HashSecret, hashData.toString());
        return VNPayConfig.vnp_PayUrl + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;
    }

    @Override
    @Transactional
    public String handleVNPayCallback(Map<String, String> queryParams) {
        String vnp_ResponseCode = queryParams.get("vnp_ResponseCode");
        String orderIdStr = queryParams.get("vnp_TxnRef");
        String vnp_TransactionNo = queryParams.get("vnp_TransactionNo");

        // "00" có nghĩa là khách hàng giao dịch thành công tại cổng VNPay
        if ("00".equals(vnp_ResponseCode) && orderIdStr != null) {
            Long orderId = Long.parseLong(orderIdStr);
            Order order = orderRepository.findById(orderId).orElse(null);

            if (order != null && order.getStatus() != OrderStatus.COMPLETED) {
                BigDecimal finalAmount = order.getTotalAmount().multiply(new BigDecimal("1.10"));

                order.setStatus(OrderStatus.COMPLETED);
                if (order.getTable() != null) {
                    order.getTable().setStatus(TableStatus.AVAILABLE); // Trả về trạng thái trống EMPTY
                }
                orderRepository.save(order);

                Invoice invoice = new Invoice();
                invoice.setInvoiceDate(LocalDateTime.now());
                invoice.setFinalAmount(finalAmount);
                order.setInvoice(invoice);
                invoiceRepository.save(invoice);

                Payment payment = new Payment();
                payment.setAmount(finalAmount);
                payment.setSuccess(true);
                invoice.addPayment(payment);
                paymentRepository.save(payment);

                PaymentTransaction tx = new PaymentTransaction();
                tx.setPayment(payment);
                tx.setTransactionCode(vnp_TransactionNo);
                tx.setGateway("VNPAY");
                tx.setGatewayResponse("vnp_ResponseCode: " + vnp_ResponseCode);
                tx.setSuccess("00".equals(vnp_ResponseCode)); // Nếu mã phản hồi là "00" thì là true (thành công)

                transactionRepository.save(tx);

                return "Thanh toán QR VNPay thành công! Bàn ăn đã giải phóng.";
            }
        }
        return "Giao dịch thất bại hoặc mã hóa đơn không hợp lệ.";
    }
}