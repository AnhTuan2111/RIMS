package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.config.VNPayConfig;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.PaymentResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.VNPayResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Order;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Payment;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.OrderRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService
{

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final InvoiceRepository invoiceRepository;
    private final VNPayConfig vnpayConfig;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TableDashboardResponse> getTablesDashboard()
    {
        List<RestaurantTable> tables = tableRepository.findAll();
        List<Order> activeOrders = orderRepository.findByStatus(OrderStatus.SERVING);

        Map<Integer, Long> tableOrderMap = activeOrders.stream()
                .filter(o -> o.getTable() != null)
                .collect(Collectors.toMap(
                        o -> o.getTable().getId(),
                        Order::getId,
                        (existing, replacement) -> existing));

        return tables.stream()
                .map(t ->
                {
                    Long orderId = tableOrderMap.get(t.getId());
                    TableStatus cashierStatus = (orderId != null) ? TableStatus.SERVING : TableStatus.AVAILABLE;
                    return TableDashboardResponse.builder()
                            .tableId(t.getId())
                            .tableNumber(t.getTableNumber())
                            .status(cashierStatus)
                            .orderId(orderId)
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(Long orderId)
    {
        Order order = orderRepository.findOrderWithDetailsById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng tương ứng"));

        // 1. Lọc danh sách OrderItem chỉ lấy món đã COMPLETED
        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .filter(oi -> oi.getStatus() == OrderItemStatus.COMPLETED)
                .map(oi -> OrderItemResponse.builder()
                        .orderItemId(oi.getId())
                        .dishName(oi.getDish() != null ? oi.getDish().getName() : "Món ăn không xác định")
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .subTotal(oi.getSubTotal())
                        .note(oi.getNote())
                        .build())
                .toList();

        // 2. Tính tổng tiền động dựa TRÊN CÁC MÓN COMPLETED
        BigDecimal totalBeforeVat = itemResponses.stream()
                .map(OrderItemResponse::getSubTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        return OrderDetailResponse.builder()
                .orderId(order.getId())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : "N/A")
                .createdAt(order.getCreatedAt())
                .orderItems(itemResponses)
                .totalAmountBeforeVat(totalBeforeVat)
                .vatAmount(vatAmount)
                .finalAmount(finalAmount)
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse processPayment(Long orderId, PaymentRequest request)
    {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() == OrderStatus.LOCKED)
        {
            return PaymentResponse.builder()
                    .message("Đơn hàng đã được khóa từ trước. Sẵn sàng thanh toán!")
                    .success(true)
                    .build();
        }

        if (order.getStatus() != OrderStatus.SERVING)
        {
            throw new RuntimeException("Đơn hàng này đã thanh toán xong hoặc không tồn tại!");
        }

        order.setStatus(OrderStatus.LOCKED);
        orderRepository.save(order);

        return PaymentResponse.builder()
                .message("Đã khóa đơn hàng. Sẵn sàng thanh toán")
                .success(true)
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse completeCashPayment(Long orderId, PaymentRequest request)
    {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.LOCKED)
        {
            throw new RuntimeException("Đơn hàng chưa được chốt (LOCKED) hoặc đã thanh toán xong!");
        }

        BigDecimal totalBeforeVat = calculateActualTotal(order);
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        if (request.getCustomerId() != null) {
            User customer = userRepository.findById(request.getCustomerId()).orElse(null);
            if (customer != null) {
                // 1. Khách dùng điểm để trừ tiền hóa đơn (Tiêu điểm)
                if (request.getPointsUsed() != null && request.getPointsUsed() > 0) {
                    if (customer.getRewardPoints() < request.getPointsUsed()) {
                        throw new RuntimeException("Khách hàng không đủ điểm!");
                    }
                    // Trừ điểm trong ví của khách
                    customer.setRewardPoints(customer.getRewardPoints() - request.getPointsUsed());

                    // Trừ tiền trong hóa đơn (1 điểm = 1 VNĐ)
                    BigDecimal discount = new BigDecimal(request.getPointsUsed());
                    finalAmount = finalAmount.subtract(discount);
                    if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;
                }

                // 2. Khách được cộng điểm mới dựa trên số tiền THỰC TRẢ (Ví dụ: tích 5%)
                int earnedPoints = finalAmount.multiply(new BigDecimal("0.05")).intValue();
                customer.setRewardPoints(customer.getRewardPoints() + earnedPoints);

                // Lưu cập nhật điểm vào Database
                userRepository.save(customer);
            }
        }

        BigDecimal amountPaid = BigDecimal.valueOf(request.getAmountPaid());

        if (amountPaid.compareTo(finalAmount) < 0)
        {
            throw new RuntimeException("Khách đưa thiếu tiền!");
        }
        BigDecimal excessAmount = amountPaid.subtract(finalAmount);

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setFinalAmount(finalAmount);
        invoice.setInvoiceDate(java.time.LocalDateTime.now());

        Payment payment = new Payment();
        payment.setAmount(amountPaid);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setSuccess(true);
        invoice.addPayment(payment);

        invoiceRepository.save(invoice);

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        if (order.getTable() != null)
        {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        return PaymentResponse.builder()
                .message("Thanh toán tiền mặt thành công")
                .success(true)
                .invoiceId(invoice.getId())
                .amountPaid(amountPaid)
                .excessAmount(excessAmount)
                .build();
    }
    @Override
    @Transactional
    public PaymentResponse unlockOrder(Long orderId)
    {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() == OrderStatus.LOCKED)
        {
            order.setStatus(OrderStatus.SERVING);
            orderRepository.save(order);

            return PaymentResponse.builder()
                    .message("Đã hủy quá trình thanh toán, bàn tiếp tục phục vụ.")
                    .success(true)
                    .build();
        }

        return PaymentResponse.builder()
                .message("Đơn hàng không ở trạng thái khóa.")
                .success(false)
                .build();
    }

    @Override
    @Transactional
    public void processVnPayFailed(String vnpTxnRef)
    {
        String[] parts = vnpTxnRef.split("_");
        Long orderId = Long.parseLong(parts[1]);

        Order order = orderRepository.findById(orderId).orElse(null);

        if (order != null && order.getStatus() == OrderStatus.LOCKED)
        {
            order.setStatus(OrderStatus.SERVING);
            orderRepository.save(order);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public VNPayResponse createVNPayPaymentUrl(Long orderId)
    {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.SERVING && order.getStatus() != OrderStatus.LOCKED)
        {
            throw new RuntimeException("Đơn hàng này đã thanh toán xong hoặc không hợp lệ!");
        }

        // ĐÃ SỬA: Lấy tổng tiền thực tế của các món COMPLETED
        BigDecimal totalBeforeVat = calculateActualTotal(order);

        if (totalBeforeVat == null || totalBeforeVat.compareTo(BigDecimal.ZERO) <= 0)
        {
            throw new RuntimeException("Đơn hàng chưa có món ăn hoàn thành (Tổng tiền = 0đ)!");
        }

        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);
        long amountVND = finalAmount.setScale(0, RoundingMode.HALF_UP).longValue() * 100;

        String vnp_TxnRef = "RIMS_" + order.getId() + "_" + System.currentTimeMillis();
        String ipAddress = "127.0.0.1";

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnpayConfig.getVnpVersion());
        vnp_Params.put("vnp_Command", vnpayConfig.getVnpCommand());
        vnp_Params.put("vnp_TmnCode", vnpayConfig.getVnpTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amountVND));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang RIMS ID " + order.getId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_IpAddr", ipAddress);

        vnp_Params.put("vnp_ReturnUrl", "http://localhost:8080/rims/cashier/payments/vnpay-callback");

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", now.format(formatter));

        Map<String, String> sortedParams = new TreeMap<>(vnp_Params);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try
        {
            Iterator<Map.Entry<String, String>> itr = sortedParams.entrySet().iterator();
            while (itr.hasNext())
            {
                Map.Entry<String, String> entry = itr.next();
                String fieldName = entry.getKey();
                String fieldValue = entry.getValue();

                if ((fieldValue != null) && (!fieldValue.trim().isEmpty()))
                {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    query.append(java.net.URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                    query.append('=');
                    query.append(java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    if (itr.hasNext())
                    {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
        } catch (Exception e)
        {
            throw new RuntimeException("Lỗi mã hóa dữ liệu VNPay", e);
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = vnpayConfig.hmacSHA512(vnpayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        String paymentUrl = vnpayConfig.getVnpUrl() + "?" + queryUrl;

        return new VNPayResponse(paymentUrl, "Sinh link thanh toán VNPay thành công!", true);
    }

    @Override
    @Transactional
    public Long processVnPaySuccess(String vnpTxnRef)
    {
        String[] parts = vnpTxnRef.split("_");
        Long orderId = Long.parseLong(parts[1]);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng từ VNPay"));

        if (order.getStatus() == OrderStatus.COMPLETED)
        {
            throw new RuntimeException("Đơn hàng này đã được thanh toán rồi!");
        }

        // ĐÃ SỬA: Tính lại VAT dựa trên tổng tiền thực tế của các món COMPLETED
        BigDecimal totalBeforeVat = calculateActualTotal(order);
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setFinalAmount(finalAmount);
        invoice.setInvoiceDate(java.time.LocalDateTime.now());

        Payment payment = new Payment();
        payment.setAmount(finalAmount);
        payment.setPaymentMethod(PaymentMethod.QRCODE);
        payment.setSuccess(true);
        invoice.addPayment(payment);

        invoiceRepository.save(invoice);

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        if (order.getTable() != null)
        {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        return invoice.getId();
    }
    
    private BigDecimal calculateActualTotal(Order order) {
        if (order.getOrderItems() == null) return BigDecimal.ZERO;

        return order.getOrderItems().stream()
                .filter(oi -> oi.getStatus() == OrderItemStatus.COMPLETED)
                .map(oi -> oi.getSubTotal())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    @Transactional(readOnly = true)
    public User searchCustomerByPhone(String phone) {
        return userRepository.findByPhone(phone).orElse(null);
    }

    @Override
    @Transactional
    public User createCustomerFast(String fullName, String phone, String email) {
        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Số điện thoại này đã tồn tại!");
        }
        User user = new User();
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setEmail(email != null && !email.isEmpty() ? email : phone + "@rims.com");

        // Sinh username và password rác để lấp vào Database
        user.setUsername("CUST_" + System.currentTimeMillis());
        user.setPasswordHash("DUMMY_HASH_" + java.util.UUID.randomUUID().toString());
        user.setRole(RoleType.CUSTOMER);
        user.setRewardPoints(0);
        user.setActive(true);

        return userRepository.save(user);
    }
}