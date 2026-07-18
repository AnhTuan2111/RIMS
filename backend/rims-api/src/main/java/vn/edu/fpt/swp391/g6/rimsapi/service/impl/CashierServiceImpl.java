package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.fpt.swp391.g6.rimsapi.config.VNPayConfig;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.payment.PaymentRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.PaymentResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.payment.VNPayResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.CashierInvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.CashierInvoiceItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.CashierInvoiceSummaryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.PagedInvoiceResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDashboardResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;
import vn.edu.fpt.swp391.g6.rimsapi.util.WebSocketBroadcaster;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final InvoiceRepository invoiceRepository;
    private final VNPayConfig vnpayConfig;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final WebSocketBroadcaster webSocketBroadcaster;
    private final PasswordEncoder passwordEncoder;

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
                        .dishName(oi.getDishNameSnapshot())
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
        Order order = orderRepository.findOrderWithDetailsById(orderId) // ĐỔI: cần load kèm orderItems
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

        List<OrderItem> items = order.getOrderItems() != null ? order.getOrderItems() : List.of();

        // MỚI: chặn nếu còn món chưa xử lý xong
        boolean hasPreparingItem = items.stream()
                .anyMatch(item -> item.getStatus() == OrderItemStatus.PREPARING);

        if (hasPreparingItem)
        {
            String preparingNames = items.stream()
                    .filter(item -> item.getStatus() == OrderItemStatus.PREPARING)
                    .map(item -> item.getDishNameSnapshot() + " x" + item.getQuantity())
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("Không thể thanh toán, còn món chưa hoàn thành: " + preparingNames); // ĐỔI: RuntimeException -> IllegalArgumentException để trả đúng mã 400
        }

        // MỚI: nếu không còn PREPARING nhưng cũng không có món nào COMPLETED -> toàn bộ đã bị hủy
        boolean hasCompletedItem = items.stream()
                .anyMatch(item -> item.getStatus() == OrderItemStatus.COMPLETED);

        if (!hasCompletedItem)
        {
            order.setStatus(OrderStatus.COMPLETED); // dùng lại giá trị enum có sẵn, không tạo Invoice
            orderRepository.save(order);
            releaseTableAfterOrderClose(order);

            return PaymentResponse.builder()
                    .message("Bàn không có món nào được hoàn thành, đơn đã được đóng và giải phóng bàn.")
                    .success(true)
                    .autoClosedNoPayment(true)
                    .build();
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
    public PaymentResponse completeCashPayment(Long orderId, PaymentRequest request) {
        Order order = orderRepository.findOrderWithDetailsById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.LOCKED) {
            throw new RuntimeException("Đơn hàng chưa được chốt (LOCKED) hoặc đã thanh toán xong!");
        }

        BigDecimal totalBeforeVat = calculateActualTotal(order);
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        // Tạo trước Invoice để lát nữa set dữ liệu
        Invoice invoice = new Invoice();

        // Áp dụng logic điểm dùng chung (trừ điểm giảm giá + cộng điểm tích lũy)
        Integer customerId = request.getCustomerId();
        Integer pointsUsed = request.getPointsUsed();
        finalAmount = applyLoyaltyPoints(invoice, customerId, pointsUsed, finalAmount);

        BigDecimal amountPaid = BigDecimal.valueOf(request.getAmountPaid());
        if (amountPaid.compareTo(finalAmount) < 0) {
            throw new RuntimeException("Khách đưa thiếu tiền!");
        }
        BigDecimal excessAmount = amountPaid.subtract(finalAmount);

        // Lưu Hóa đơn & Đóng order
        invoice.setOrder(order);
        invoice.setFinalAmount(finalAmount);
        invoice.setInvoiceDate(LocalDateTime.now());

        invoice.calculateAndSetRevenue(vatAmount);

        Payment payment = new Payment();
        payment.setAmount(amountPaid);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setSuccess(true);
        invoice.addPayment(payment);

        invoiceRepository.save(invoice);
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        releaseTableAfterOrderClose(order);

        return PaymentResponse.builder()
                .message("Thanh toán tiền mặt thành công")
                .success(true)
                .invoiceId(invoice.getId())
                .amountPaid(amountPaid)
                .excessAmount(excessAmount)
                .finalAmount(finalAmount)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getFullName() : null)
                .pointsUsed(invoice.getPointsUsedOnInvoice())
                .pointsEarned(invoice.getPointsEarnedOnInvoice())
                .paymentMethod("CASH")
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
            // Xóa dữ liệu điểm tạm vì hủy quá trình thanh toán
            order.setPendingCustomerId(null);
            order.setPendingPointsUsed(null);
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
            // Xóa dữ liệu điểm tạm vì thanh toán thất bại, không áp dụng nữa
            order.setPendingCustomerId(null);
            order.setPendingPointsUsed(null);
            orderRepository.save(order);
        }
    }

    @Override
    @Transactional
    public VNPayResponse createVNPayPaymentUrl(Long orderId, Integer customerId, Integer pointsUsed)
    {
        Order order = orderRepository.findOrderWithDetailsById(orderId)
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

        // ĐÃ THÊM: Nếu khách chọn dùng điểm, trừ tạm vào số tiền phải trả qua VNPay
        // (chưa trừ/cộng điểm thật vào tài khoản khách — việc đó chỉ làm khi callback thành công)
        if (customerId != null)
        {
            User customer = userRepository.findById(customerId).orElse(null);
            if (customer != null && pointsUsed != null && pointsUsed > 0)
            {
                if (customer.getRewardPoints() < pointsUsed)
                {
                    throw new RuntimeException("Khách hàng không đủ điểm!");
                }
                BigDecimal discount = new BigDecimal(pointsUsed).multiply(new BigDecimal("1000"));
                BigDecimal maxDiscount = finalAmount.multiply(new BigDecimal("0.5"));
                if (discount.compareTo(maxDiscount) > 0)
                {
                    throw new RuntimeException("Số điểm sử dụng vượt quá 50% hóa đơn cho phép!");
                }
                finalAmount = finalAmount.subtract(discount);
                if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;
            }
        }

        // ĐÃ THÊM: Lưu tạm customerId/pointsUsed vào Order để lấy lại lúc VNPay callback về
        order.setPendingCustomerId(customerId);
        order.setPendingPointsUsed(pointsUsed);
        order.setStatus(OrderStatus.LOCKED);
        orderRepository.save(order);

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

        Order order = orderRepository.findOrderWithDetailsById(orderId)
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

        // ĐÃ THÊM: Lấy lại customerId/pointsUsed đã lưu tạm lúc tạo link VNPay,
        // rồi áp dụng đúng logic trừ/cộng điểm y hệt luồng tiền mặt
        Integer customerId = order.getPendingCustomerId();
        Integer pointsUsed = order.getPendingPointsUsed();
        finalAmount = applyLoyaltyPoints(invoice, customerId, pointsUsed, finalAmount);

        // Dọn dẹp dữ liệu tạm sau khi đã dùng xong
        order.setPendingCustomerId(null);
        order.setPendingPointsUsed(null);

        invoice.setOrder(order);
        invoice.setFinalAmount(finalAmount);
        invoice.setInvoiceDate(java.time.LocalDateTime.now());

        invoice.calculateAndSetRevenue(vatAmount);

        Payment payment = new Payment();
        payment.setAmount(finalAmount);
        payment.setPaymentMethod(PaymentMethod.QRCODE);
        payment.setSuccess(true);
        invoice.addPayment(payment);

        invoiceRepository.save(invoice);

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        releaseTableAfterOrderClose(order);

        return invoice.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public User searchCustomerByPhone(String phone) {
        User user = userRepository.findByPhone(phone).orElse(null);
        if (user != null && user.getRole() == RoleType.CUSTOMER) {
            return user;
        }
        return null;
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

        // Dùng luôn SĐT làm username (đã đảm bảo duy nhất qua check existsByPhone ở trên),
        // mật khẩu mặc định "123456" được mã hóa bằng đúng PasswordEncoder (BCrypt) dùng chung
        // với toàn hệ thống, để khách có thể đăng nhập thật bằng SĐT + mật khẩu này về sau.
        user.setUsername(phone);
        user.setPasswordHash(passwordEncoder.encode("123456"));
        user.setRole(RoleType.CUSTOMER);
        user.setRewardPoints(0);
        user.setActive(true);

        return userRepository.save(user);
    }


    @Override
    @Transactional(readOnly = true)
    public PagedInvoiceResponse getTodayInvoices(String tableNumber, String keyword, String paymentMethod, String invoiceCode, int page, int size)
    {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        List<Invoice> todayInvoices = invoiceRepository.findByInvoiceDateBetween(startOfDay, endOfDay);

        List<Invoice> filtered = todayInvoices.stream()
                .filter(inv -> tableNumber == null || tableNumber.isBlank()
                        || (inv.getOrder().getTable() != null
                        && inv.getOrder().getTable().getTableNumber().equalsIgnoreCase(tableNumber)))
                .filter(inv -> paymentMethod == null || paymentMethod.isBlank()
                        || (inv.getPayments() != null && !inv.getPayments().isEmpty()
                        && inv.getPayments().get(0).getPaymentMethod().name().equalsIgnoreCase(paymentMethod)))
                .filter(inv -> keyword == null || keyword.isBlank()
                        || (inv.getCustomer() != null && (
                        inv.getCustomer().getFullName().toLowerCase().contains(keyword.toLowerCase())
                                || inv.getCustomer().getPhone().contains(keyword))))
                .filter(inv -> invoiceCode == null || invoiceCode.isBlank()
                        || String.valueOf(inv.getId()).contains(invoiceCode.replaceAll("[^0-9]", "")))
                .sorted(Comparator.comparing(Invoice::getInvoiceDate).reversed())
                .toList();

        int totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Invoice> pageContent = filtered.subList(fromIndex, toIndex);

        List<CashierInvoiceSummaryResponse> content = pageContent.stream()
                .map(inv -> CashierInvoiceSummaryResponse.builder()
                        .invoiceId(inv.getId())
                        .tableNumber(inv.getOrder().getTable() != null ? inv.getOrder().getTable().getTableNumber() : "Mang về")
                        .invoiceDate(inv.getInvoiceDate())
                        .finalAmount(inv.getFinalAmount())
                        .customerName(inv.getCustomer() != null ? inv.getCustomer().getFullName() : null)
                        .paymentMethod(inv.getPayments() != null && !inv.getPayments().isEmpty()
                                ? inv.getPayments().get(0).getPaymentMethod().name() : null)
                        .pointsUsed(inv.getPointsUsedOnInvoice())
                        .pointsEarned(inv.getPointsEarnedOnInvoice())
                        .build())
                .toList();

        return PagedInvoiceResponse.builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CashierInvoiceDetailResponse getInvoiceDetailForCashier(Long invoiceId)
    {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        Order order = invoice.getOrder();

        // Chỉ lấy món COMPLETED, khớp với logic PDF đã sửa trước đó
        List<OrderItem> completedItems = order.getOrderItems().stream()
                .filter(oi -> oi.getStatus() == OrderItemStatus.COMPLETED)
                .toList();

        BigDecimal totalBeforeVat = completedItems.stream()
                .map(OrderItem::getSubTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));

        List<CashierInvoiceItemResponse> items = completedItems.stream()
                .map(oi -> CashierInvoiceItemResponse.builder()
                        .dishName(oi.getDishNameSnapshot())
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .subTotal(oi.getSubTotal())
                        .build())
                .toList();

        Payment firstPayment = (invoice.getPayments() != null && !invoice.getPayments().isEmpty())
                ? invoice.getPayments().get(0) : null;

        BigDecimal amountPaid = (firstPayment != null && firstPayment.getAmount() != null)
                ? firstPayment.getAmount() : invoice.getFinalAmount();
        BigDecimal excessAmount = amountPaid.subtract(invoice.getFinalAmount());
        if (excessAmount.compareTo(BigDecimal.ZERO) < 0) excessAmount = BigDecimal.ZERO;

        return CashierInvoiceDetailResponse.builder()
                .invoiceId(invoice.getId())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : "Mang về")
                .invoiceDate(invoice.getInvoiceDate())
                .items(items)
                .totalBeforeVat(totalBeforeVat)
                .vatAmount(vatAmount)
                .finalAmount(invoice.getFinalAmount())
                .paymentMethod(firstPayment != null ? firstPayment.getPaymentMethod().name() : null)
                .amountPaid(amountPaid)
                .excessAmount(excessAmount)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getFullName() : null)
                .pointsUsed(invoice.getPointsUsedOnInvoice())
                .pointsEarned(invoice.getPointsEarnedOnInvoice())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Invoice getInvoiceWithDetails(Long invoiceId) {
        return invoiceRepository.findWithOrderAndItemsById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));
    }

    @Scheduled(fixedRate = 3600000) // 1 giờ/lần — không cấp thiết như 2 job kia
    @Transactional
    public void cleanupStaleCancelledOrders()
    {
        LocalDateTime cutoff = LocalDate.now().atStartOfDay(); // đầu ngày hôm nay — xóa mọi Order "toàn hủy" từ hôm qua trở về trước

        List<Order> staleOrders = orderRepository
                .findByStatusAndInvoiceIsNullAndCreatedAtBefore(OrderStatus.COMPLETED, cutoff);

        if (!staleOrders.isEmpty())
        {
            orderRepository.deleteAll(staleOrders); // cascade xóa OrderItem con luôn (đã xác nhận cascade=ALL, orphanRemoval=true)
        }
    }

    private BigDecimal calculateActualTotal(Order order) {
        if (order.getOrderItems() == null) return BigDecimal.ZERO;

        return order.getOrderItems().stream()
                .filter(oi -> oi.getStatus() == OrderItemStatus.COMPLETED)
                .map(oi -> oi.getSubTotal())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal applyLoyaltyPoints(Invoice invoice, Integer customerId, Integer pointsUsed, BigDecimal finalAmount)
    {
        if (customerId == null) return finalAmount;

        User customer = userRepository.findById(customerId).orElse(null);
        if (customer == null) return finalAmount;

        invoice.setCustomer(customer);
        int safePointsUsed = pointsUsed != null ? pointsUsed : 0;

        if (safePointsUsed > 0)
        {
            if (customer.getRewardPoints() < safePointsUsed)
            {
                throw new RuntimeException("Khách hàng không đủ điểm!");
            }
            BigDecimal discount = new BigDecimal(safePointsUsed).multiply(new BigDecimal("1000"));
            BigDecimal maxDiscount = finalAmount.multiply(new BigDecimal("0.5"));
            if (discount.compareTo(maxDiscount) > 0)
            {
                throw new RuntimeException("Số điểm sử dụng vượt quá 50% hóa đơn cho phép!");
            }
            customer.setRewardPoints(customer.getRewardPoints() - safePointsUsed);
            finalAmount = finalAmount.subtract(discount);
            if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;
            invoice.setPointsUsedOnInvoice(safePointsUsed);
        }

        int earnedPoints = finalAmount.multiply(new BigDecimal("0.01"))
                .divide(new BigDecimal("1000"), 0, RoundingMode.DOWN)
                .intValue();
        customer.setRewardPoints(customer.getRewardPoints() + earnedPoints);
        userRepository.save(customer);
        invoice.setPointsEarnedOnInvoice(earnedPoints);

        return finalAmount;
    }

    private void releaseTableAfterOrderClose(Order order)
    {
        if (order.getTable() == null) return;

        RestaurantTable table = order.getTable();
        boolean hasUpcomingReservation = reservationRepository
                .findFirstByTableAndStatusInAndReservationTimeAfterOrderByReservationTimeAsc(
                        table,
                        List.of(ReservationStatus.WAITING, ReservationStatus.QUEUED),
                        LocalDateTime.now()
                ).isPresent();
        table.setStatus(hasUpcomingReservation ? TableStatus.RESERVED : TableStatus.AVAILABLE);
        tableRepository.save(table);
        webSocketBroadcaster.broadcastAfterCommit("/topic/tables", "TABLE_UPDATED");
    }
}