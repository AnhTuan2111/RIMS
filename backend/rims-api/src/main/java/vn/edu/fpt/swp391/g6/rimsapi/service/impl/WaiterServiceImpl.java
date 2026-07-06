package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.order.CreateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.order.OrderItemRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.order.UpdateOrderItemRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.order.UpdateOrderRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation.CreateReservationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.MenuItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.CreateOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.OrderItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.order.UpdateOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.ReservationDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.*;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.TableNotAvailableException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.*;
import vn.edu.fpt.swp391.g6.rimsapi.service.WaiterService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class WaiterServiceImpl implements WaiterService
{
    private final RestaurantTableRepository restaurantTableRepository;
    private final ReservationRepository reservationRepository;
    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        }

        order.setTotalAmount(total);

        // 5. Save order (cascades OrderItems)
        orderRepository.save(order);

        // 6. Update table status
        table.setStatus(TableStatus.SERVING);
        restaurantTableRepository.save(table);

        // BƯỚC MỚI: PHÁT LOA THÔNG BÁO CHO ĐẦU BẾP
        // Gửi một tin nhắn đơn giản mang chữ "REFRESH" vào kênh của bếp
        messagingTemplate.convertAndSend("/topic/kitchen", "REFRESH");

        // 7. Return response
        return CreateOrderResponse.builder()
                .orderId(order.getId())
                .tableNumber(table.getTableNumber())
                .message("Tạo đơn thành công cho bàn " + table.getTableNumber())
                .totalAmount(total)
                .build();
    }

    @Override
    @Transactional
    public UpdateOrderResponse updateOrder(Long id, UpdateOrderRequest updateOrderRequest, Integer waiterId)
    {
        // nhận order id để validate (order đang serving và table đang serving)
        // update order request là danh sách (update order items request) bao gồm các món (dish) số lượng món (quantity) và note của món tương ứng

        // các món đã trong trạng thái COMPLETE thì chỉ có thêm số lượng chứ không giảm đi được, tức là số lượng lúc sau phải luôn >= số lượng ban đầu, nếu không thì lỗi
        // còn các món mà trong trạng thái PREPARING thì thêm bớt tùy ý

        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("order Id " + id + " not found"));

        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + waiterId));

        if (order.getStatus() != OrderStatus.SERVING)
        {
            throw new IllegalArgumentException("cannot update order that not in serving status");
        }

        if (order.getTable().getStatus() != TableStatus.SERVING)
        {
            throw new IllegalArgumentException("you can only update table that its status is SERVING");
        }

        // bây giờ đã validate xong order, việc cần làm tiếp theo là đối chiếu order request với order gốc, xem có thay đổi cập nhật gì, lúc này sẽ validate các item trong order

        // vì bên trong order request có các order item request và trong order có các order item, nên bản chất cả bên trong cả 2 là 2 object khác nhau nên không thể so sánh bình thường được.
        // thay vào đó, ta sẽ sử dụng order item id để lọc và tạo trung gian
        for (UpdateOrderItemRequest itemRequest : updateOrderRequest.getItems())
        {
            // cập nhật món cũ
            if (itemRequest.getOrderItemId() != null)
            {
                // kiểm tra validate order item phải ở trong order, nếu không tìm thấy thì để null
                OrderItem existedItem = isExist(itemRequest.getOrderItemId(), order);

                if (existedItem == null)
                {
                    throw new IllegalArgumentException("item Id " + itemRequest.getOrderItemId() + " not found");
                }

                if (itemRequest.getQuantity() == null || itemRequest.getDishId() == null)
                {
                    throw new IllegalArgumentException("item Id " + itemRequest.getOrderItemId() + " cannot have empty quantity or dish");
                }

                switch (existedItem.getStatus())
                {
                    case COMPLETED: // chỉ có thể thêm số lượng chứ không bớt đi được. nếu thêm số lượng thì sẽ tạo order item mới với số lượng bằng phần dư khi trừ (để không bị trùng)
                    {
                        if (itemRequest.getQuantity() < existedItem.getQuantity())
                        {
                            throw new IllegalArgumentException("item Id " + itemRequest.getOrderItemId() + " is COMPLETE, cannot reduce quantity");
                        } else if (itemRequest.getQuantity() > existedItem.getQuantity())
                        {
                            // tạo order item mới đế không bị nhầm lẫn với order item khác
                            OrderItem orderItem = new OrderItem();
                            orderItem.setDish(existedItem.getDish());
                            orderItem.setQuantity(itemRequest.getQuantity() - existedItem.getQuantity());
                            orderItem.setUnitPrice(existedItem.getUnitPrice());
                            orderItem.setSubTotal(existedItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity())));
                            orderItem.setNote(itemRequest.getNote());
                            orderItem.setStatus(OrderItemStatus.PREPARING);
                            order.addOrderItem(orderItem);
                        }
                        break;
                    }
                    case PREPARING:
                    {
                        if (itemRequest.getQuantity() == 0)
                        {
                            order.removeOrderItem(existedItem);
                        } else
                        {
                            existedItem.setQuantity(itemRequest.getQuantity());
                            existedItem.setSubTotal(existedItem.getUnitPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
                            existedItem.setNote(itemRequest.getNote());
                        }
                        break;
                    }
                    case CANCELLED:
                    {
                        throw new IllegalArgumentException("item Id " + itemRequest.getOrderItemId() + " is CANCELLED, cannot update");
                    }
                }
            } else // món mới khi gửi đi sẽ có orderitem id là null
            {
                Dish dish = dishRepository.findById(itemRequest.getDishId())
                        .orElseThrow(() -> new IllegalArgumentException("not found dishID: " + itemRequest.getDishId()));

                OrderItem orderItem = new OrderItem();
                orderItem.setDish(dish);
                orderItem.setQuantity(itemRequest.getQuantity());
                BigDecimal unitPrice = BigDecimal.valueOf(dish.getPrice());
                orderItem.setUnitPrice(unitPrice);
                orderItem.setSubTotal(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
                orderItem.setNote(itemRequest.getNote());
                orderItem.setStatus(OrderItemStatus.PREPARING);

                order.addOrderItem(orderItem);
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : order.getOrderItems())
        {
            total = total.add(item.getSubTotal());
        }
        order.setTotalAmount(total);
        orderRepository.save(order);

        messagingTemplate.convertAndSend("/topic/kitchen", "REFRESH");

        return UpdateOrderResponse.builder()
                .orderId(order.getId())
                .tableNumber(order.getTable().getTableNumber())
                .message("Cập nhật đơn hàng thành công cho bàn " + order.getTable().getTableNumber())
                .totalAmount(total)
                .build();
    }

    private OrderItem isExist(Long itemId, Order order)
    {
        for (OrderItem orderItem : order.getOrderItems())
        {
            if (orderItem.getId().equals(itemId))
            {
                return orderItem;
            }
        }
        return null;
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
    public List<OrderDetailResponse> getServingOrders(int tableId)
    {
        List<Order> orders = orderRepository.findServingOrdersWithDetails(tableId);
        List<OrderDetailResponse> orderDetailResponses = new ArrayList<>();
        for (Order order : orders)
        {
            orderDetailResponses.add(
                    OrderDetailResponse.builder().
                            orderId(order.getId())
                            .tableNumber(order.getTable().getTableNumber())
                            .createdAt(order.getCreatedAt())
                            .orderItems(order.getOrderItems().stream().map(
                                    orderItem ->
                                    {
                                        OrderItemResponse response = new OrderItemResponse();
                                        response.setOrderItemId(orderItem.getId());
                                        response.setDishName(orderItem.getDish().getName());
                                        response.setStatus(orderItem.getStatus());
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

    @Override
    public String createReservation(CreateReservationRequest request)
    {
        RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn với ID: " + request.getTableId()));

        if (request.getReservationTime().isBefore(LocalDateTime.now()))
        {
            throw new IllegalArgumentException("Thời gian đặt bàn phải ở trong tương lai.");
        }

        LocalDateTime start = request.getReservationTime().minusMinutes(150);
        LocalDateTime end = request.getReservationTime().plusMinutes(150);

        List<Reservation> existingReservations = reservationRepository.findByTableIdAndReservationTimeBetween(request.getTableId(), start, end);

        for (Reservation res : existingReservations)
        {
            if (res.getStatus() != ReservationStatus.CANCELLED)
            {
                if (res.getReservationTime().isAfter(start) && res.getReservationTime().isBefore(end))
                {
                    throw new IllegalArgumentException("Bàn đã được đặt trong khoảng thời gian này, các đơn phải cách nhau ít nhất 2.5 tiếng.");
                }
            }
        }

        Reservation reservation = new Reservation();
        reservation.setCustomerName(request.getCustomerName());
        reservation.setPhone(request.getPhone());
        reservation.setNote(request.getNote());
        reservation.setReservationTime(request.getReservationTime());
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.QUEUED);

        reservationRepository.save(reservation);

        return "Tạo đơn đặt bàn thành công";
    }

    @Override
    public List<ReservationDetailResponse> viewReservationsByTableAndTime(int tableId, LocalDate date)
    {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        // tìm reservation tương ứng với số bàn và ngày, lúc này dữ liệu sẽ ra 1 list
        return reservationRepository.findByTableIdAndReservationTimeBetween(tableId, start, end)
                .stream().map(this::toReservationResponse).toList();
    }

    @Override
    public ReservationDetailResponse viewReservationDetail(Long reservationId)
    {
        return reservationRepository.findById(reservationId)
                .map(this::toReservationResponse)
                .orElseThrow(() -> new IllegalArgumentException("Cannot find ReservationDetail for reservationId " + reservationId));
    }

    @Override
    public ReservationDetailResponse getCurrentReservationByTable(int tableId)
    {
        RestaurantTable table = restaurantTableRepository.findById(tableId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn với ID: " + tableId));

        if (table.getStatus() != TableStatus.RESERVED)
        {
            throw new IllegalArgumentException("cannot get ReservationDetail for table " + tableId);
        }

        Reservation reservation = table.getReservations().stream().filter(r -> ReservationStatus.WAITING.equals(r.getStatus())).findFirst().orElse(null);

        if (reservation == null)
        {
            throw new IllegalArgumentException("Cannot find Reservation");
        }

        return toReservationResponse(reservation);
    }

    private ReservationDetailResponse toReservationResponse(Reservation reservation)
    {
        return ReservationDetailResponse.builder()
                .reservationId(reservation.getId())
                .customerName(reservation.getCustomerName())
                .phone(reservation.getPhone())
                .note(reservation.getNote())
                .tableId(reservation.getTable().getId())
                .status(reservation.getStatus())
                .reservationTime(reservation.getReservationTime())
                .build();
    }
}
