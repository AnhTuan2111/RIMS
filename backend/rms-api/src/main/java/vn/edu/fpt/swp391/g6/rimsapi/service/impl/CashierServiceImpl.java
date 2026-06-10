package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.*;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.CashierService;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TableDashboardResponse> getTablesDashboard() {

        List<RestaurantTable> tables = tableRepository.findAll();

        List<Order> activeOrders = orderRepository.findByStatus(OrderStatus.SERVING);

        Map<Integer, Long> tableOrderMap = activeOrders.stream()
                .filter(o -> o.getTable() != null)
                .collect(Collectors.toMap(
                        o -> o.getTable().getId(),
                        Order::getOrderId,
                        (existing, replacement) -> existing
                ));

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
                .toList();
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
                .toList();

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
    public PaymentResponse processPayment(Long orderId, PaymentRequest request) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.SERVING) {
            throw new RuntimeException("Đơn hàng này đã được thanh toán hoặc không tồn tại!");
        }
        order.setStatus(OrderStatus.LOCKED);
        orderRepository.save(order);

        String methodChosen = request.getPaymentMethod();
        String notification = " Locked order.Choose method payment " + methodChosen + " success";

        PaymentResponse response = new PaymentResponse();
        response.setMessage(notification);
        response.setSuccess(true);

        return response;
    }
}