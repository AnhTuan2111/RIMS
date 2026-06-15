package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.CreateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.OrderItemRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.*;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.TableNotAvailableException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.WaiterService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class WaiterServiceImpl implements WaiterService
{
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final UserRepository userRepository;

    @Override
    public List<TableDetailResponse> getAllTables()
    {
        List<RestaurantTable> tables = restaurantTableRepository.findAll();
        List<TableDetailResponse> tableDetailResponses = new ArrayList<>();
        for (RestaurantTable table : tables)
        {
            tableDetailResponses.add(
                    TableDetailResponse.builder()
                            .tableId(table.getId())
                            .tableNumber(table.getTableNumber())
                            .capacity(table.getCapacity())
                            .status(table.getStatus())
                            .build());
        }
        return tableDetailResponses;
    }

    @Override
    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request, Integer waiterId)
    {
        // 1. Validate table
        RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn với ID: " + request.getTableId()));

        if (table.getStatus() != TableStatus.AVAILABLE && table.getStatus() != TableStatus.RESERVED)
        {
            throw new TableNotAvailableException(
                    "Bàn " + table.getTableNumber() + " hiện đang " + table.getStatus() + ", không thể tạo đơn.");
        }

        // 2. Load waiter
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + waiterId));

        // 3. Build Order
        Order order = new Order();
        order.setTable(table);
        order.setCreatedBy(waiter);
        order.setStatus(OrderStatus.SERVING);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setOrderItems(new ArrayList<>());

        // 4. Build OrderItems + accumulate total
        BigDecimal total = BigDecimal.ZERO;
        List<String> itemSummary = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems())
        {
            Dish dish = dishRepository.findById(itemReq.getDishId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món với ID: " + itemReq.getDishId()));

            BigDecimal unitPrice = BigDecimal.valueOf(dish.getPrice());
            BigDecimal subTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(subTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setDish(dish);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubTotal(subTotal);
            orderItem.setNote(itemReq.getNote());
            orderItem.setStatus(OrderItemStatus.PREPARING);

            order.addOrderItem(orderItem); // sets back-reference on OrderItem
            itemSummary.add(itemReq.getQuantity() + " x " + dish.getName());
        }

        order.setTotalAmount(total);

        // 5. Save order (cascades OrderItems)
        orderRepository.save(order);

        // 6. Update table status
        table.setStatus(TableStatus.SERVING);
        restaurantTableRepository.save(table);

        // 7. Return response
        return CreateOrderResponse.builder()
                .orderId(order.getId())
                .tableNumber(table.getTableNumber())
                .message("Tạo đơn thành công cho bàn " + table.getTableNumber())
                .itemSummary(itemSummary)
                .totalAmount(total)
                .build();
    }

    @Override
    public List<MenuItemResponse> getMenu()
    {
        return dishRepository.findByIsAvailableTrue().stream()
                .map(dish -> MenuItemResponse.builder()
                        .dishId(dish.getId())
                        .name(dish.getName())
                        .description(dish.getDescription())
                        .price(dish.getPrice())
                        .imageUrl(dish.getImageUrl())
                        .categoryName(dish.getCategory().getName())
                        .build())
                .toList();
    }

    @Override
    public List<OrderDetailResponse> getServingOrders(int tableID)
    {
        List<Order> orders = orderRepository.findServingOrdersWithDetails(tableID);
        List<OrderDetailResponse> orderDetailResponses = new ArrayList<>();
        for (Order order : orders)
        {
            orderDetailResponses.add(
                    OrderDetailResponse.builder().
                            orderId(order.getId())
                            .tableName(order.getTable().getTableNumber())
                            .createdAt(order.getCreatedAt())
                            .orderItems(order.getOrderItems().stream().map(
                                    orderItem ->
                                    {
                                        OrderItemResponse response = new OrderItemResponse();
                                        response.setOrderItemId(orderItem.getId());
                                        response.setDishName(orderItem.getDish().getName());
                                        response.setQuantity(orderItem.getQuantity());
                                        response.setUnitPrice(orderItem.getUnitPrice());
                                        response.setSubTotal(orderItem.getSubTotal());
                                        response.setNote(orderItem.getNote());
                                        return response;
                                    }
                            ).toList())
                            .build()
            );
        }
        return orderDetailResponses;
    }
}
