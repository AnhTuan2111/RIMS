package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.config.VNPayConfig;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.VNPayResponse;

import java.math.BigDecimal;
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
    private final jakarta.servlet.http.HttpServletRequest httpRequest;

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
                        (existing, replacement) -> existing
                ));

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

        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(oi -> OrderItemResponse.builder()
                        .orderItemId(oi.getId())
                        .dishName(oi.getDish() != null ? oi.getDish().getName() : "Món ăn không xác định")
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .subTotal(oi.getSubTotal())
                        .note(oi.getNote())
                        .build())
                .toList();

        BigDecimal totalBeforeVat = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal vatAmount = totalBeforeVat.multiply(new BigDecimal("0.10"));
        BigDecimal finalAmount = totalBeforeVat.add(vatAmount);

        return OrderDetailResponse.builder()
                .orderId(order.getId())
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
    public PaymentResponse processPayment(Long orderId, PaymentRequest request)
    {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.SERVING)
        {
            throw new RuntimeException("Đơn hàng này đã được thanh toán hoặc không tồn tại!");
        }
        order.setStatus(OrderStatus.LOCKED);
        orderRepository.save(order);

        String methodChosen = request.getPaymentMethod().name();
        String notification = " Locked order.Choose method payment " + methodChosen + " success";

        PaymentResponse response = new PaymentResponse();
        response.setMessage(notification);
        response.setSuccess(true);

        return response;
    }

    @Override
    @Transactional
    public PaymentResponse completeCashPayment(Long orderId) {
        // 1. Tìm đơn hàng xem có tồn tại không
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng tương ứng"));

        // 2. Kiểm tra điều kiện: BẮT BUỘC phải đang ở trạng thái LOCKED mới cho thanh toán
        if (order.getStatus() != OrderStatus.LOCKED) {
            throw new RuntimeException("Đơn hàng chưa được chốt (LOCKED) hoặc đã thanh toán xong!");
        }

        // 3. KHỞI TẠO HÓA ĐƠN CHÍNH THỨC (INVOICE) KHỚP VỚI ENTITY
        Invoice invoice = new Invoice();

        invoice.setOrder(order);

        invoice.setFinalAmount(order.getTotalAmount());

        // Điền ngày giờ tạo hóa đơn
        invoice.setInvoiceDate(java.time.LocalDateTime.now());

        // 4. KHỞI TẠO BẢN GHI THANH TOÁN (PAYMENT) ĐỂ ADD VÀO INVOICE
        Payment payment = new Payment();
        payment.setAmount(order.getTotalAmount());            // Số tiền thanh toán
        payment.setPaymentMethod(PaymentMethod.CASH);          // Phương thức tiền mặt
        payment.setSuccess(true);                        // Trạng thái thanh toán thành công

        invoice.addPayment(payment);

        // Lưu Invoice xuống DB
        invoiceRepository.save(invoice);

        // 5. CHUYỂN TRẠNG THÁI ORDER THÀNH COMPLETED
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        // 6. GIẢI PHÓNG BÀN (Chuyển thành AVAILABLE)
        if (order.getTable() != null) {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        // 7. Trả về kết quả thông báo thành công cho Frontend
        PaymentResponse response = new PaymentResponse();
        response.setMessage("Thanh toán tiền mặt thành công. Đã xuất hóa đơn, ghi nhận lịch sử giao dịch và giải phóng bàn!");
        response.setSuccess(true);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public VNPayResponse createVNPayPaymentUrl(Long orderId) {
        // 1. Tìm đơn hàng xem có tồn tại không
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // Chốt chặn an toàn: Phải khóa đơn (LOCKED) thì mới cho thanh toán quét mã
        if (order.getStatus() != OrderStatus.LOCKED) {
            throw new RuntimeException("Đơn hàng chưa được chốt khóa (LOCKED) để thanh toán!");
        }

        // 2. Lấy các thông số từ cấu hình động (file YAML) thông qua VNPayConfig của bạn
        String vnp_Version = vnpayConfig.getVnpVersion();
        String vnp_Command = vnpayConfig.getVnpCommand();
        String vnp_TmnCode = vnpayConfig.getVnpTmnCode();

        // VNPay bắt buộc số tiền nhân thêm 100 (Ví dụ: 50.000đ thì phải truyền sang là 5000000)
        long amount = order.getTotalAmount().multiply(new java.math.BigDecimal(100)).longValue();

        // Tạo mã giao dịch duy nhất dựa trên ID đơn hàng kết hợp thời gian hệ thống
        String vnp_TxnRef = "RIMS_ORDER_" + order.getId() + "_" + System.currentTimeMillis();
        String vnp_OrderInfo = "Thanh toan don hang RIMS ID " + order.getId(); // Ghi chú không dấu tránh lỗi font ngân hàng
        String vnp_OrderType = "other";
        String vnp_Locale = "vn";

        // Lấy đường link Callback đã đổi tên viết hoa từ file Config của bạn
        String vnp_ReturnUrl = VNPayConfig.VNP_RETURN_URL;

        // Lấy IP của máy đang thực hiện giao dịch qua hàm có sẵn của bạn
        String vnp_IpAddr = vnpayConfig.getIpAddress(httpRequest);

        // Định dạng ngày giờ tạo theo đúng chuẩn bắt buộc của VNPay: yyyyMMddHHmmss
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String vnp_CreateDate = now.format(formatter);

        // 3. Đưa tất cả dữ liệu vào Map để tiến hành sắp xếp Alphabet (Luật bắt buộc của VNPay)
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        // Tiến hành sắp xếp các tham số theo thứ tự chữ cái của Key
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                // Xây dựng chuỗi dữ liệu gốc để băm bảo mật
                hashData.append(fieldName).append('=').append(java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Xây dựng chuỗi query string gắn lên URL
                query.append(java.net.URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=').append(java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        // 4. Thực hiện ký chữ ký số HMAC-SHA512 để bảo mật thông tin đơn hàng
        String queryUrl = query.toString();
        String vnp_SecureHash = vnpayConfig.hmacSHA512(vnpayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        // 5. Nối với link cổng test VNPay để ra đường dẫn cuối cùng
        String paymentUrl = vnpayConfig.getVnpUrl() + "?" + queryUrl;

        return new VNPayResponse(paymentUrl, "Sinh mã QR thanh toán VNPay thành công!", true);
    }
}