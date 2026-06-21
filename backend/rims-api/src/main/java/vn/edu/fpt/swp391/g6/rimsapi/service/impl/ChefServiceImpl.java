package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishListResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.DishRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.OrderItemRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.ChefService;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import java.util.List;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen.ChefDashboardResponse;
import java.time.LocalDateTime;
@Service
@RequiredArgsConstructor
public class ChefServiceImpl implements ChefService {

    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;

    @Override
    public List<KitchenOrderResponse> getKitchenOrders() {

        return orderItemRepository
                //return orderItemRepository.findAll()
                .findByStatusOrderByCreatedAtAsc(
                        OrderItemStatus.PREPARING)
                .stream()
                .map(item -> {

                    KitchenOrderResponse response =
                            new KitchenOrderResponse();

                    response.setOrderItemId(
                            item.getId());

                    response.setOrderId(
                            item.getOrder().getId());

                    response.setTableNumber(
                            item.getOrder()
                                    .getTable()
                                    .getTableNumber());

                    response.setDishName(
                            item.getDish().getName());

                    response.setQuantity(
                            item.getQuantity());

                    response.setStatus(
                            item.getStatus());
                    response.setCreatedAt(
                            item.getCreatedAt());

                    return response;
                })
                .toList();
    }
    @Override
    public DishDetailResponse getDishDetail(Long orderItemId) {

        OrderItem item = orderItemRepository
                .findById(orderItemId)
                .orElseThrow();

        // Chỉ cho xem món đang PREPARING
        if (item.getStatus() != OrderItemStatus.PREPARING) {
            throw new RuntimeException("Dish already completed");
        }

        DishDetailResponse response = new DishDetailResponse();

        response.setOrderItemId(item.getId());

        response.setTableNumber(
                item.getOrder()
                        .getTable()
                        .getTableNumber());

        response.setDishName(item.getDish().getName());

        response.setDescription(item.getDish().getDescription());

        response.setQuantity(item.getQuantity());

        response.setNote(item.getNote());

        response.setStatus(item.getStatus());
        response.setCreatedAt(
                item.getCreatedAt());

        return response;
    }
    @Override
    public void updateDishStatus(Long orderItemId,
                                 OrderItemStatus status) {

        OrderItem item = orderItemRepository
                .findById(orderItemId)
                .orElseThrow();

        // Chỉ cập nhật món đang PREPARING
        if (item.getStatus() != OrderItemStatus.PREPARING) {
            throw new RuntimeException(
                    "Dish has already been completed");
        }

        item.setStatus(status);

        orderItemRepository.save(item);
    }
    @Override
    public List<DishListResponse> getDishList() {

        return dishRepository.findAll()
                .stream()
                .map(dish -> {

                    DishListResponse response =
                            new DishListResponse();

                    response.setDishId(
                            dish.getId());

                    response.setDishName(
                            dish.getName());

                    response.setCategory(
                            dish.getCategory()
                                    .getName());

                    response.setPrice(
                            dish.getPrice());

                    response.setAvailable(
                            dish.isAvailable());
                    return response;

                })
                .toList();
    }
    @Override
    public void updateMenuStatus(
            Integer dishId,
            Boolean available)
    {
        Dish dish =
                dishRepository.findById(dishId)
                        .orElseThrow(
                                () -> new RuntimeException("Dish not found"));

        dish.setAvailable(available);

        dishRepository.save(dish);
    }
    @Override
    public ChefDashboardResponse getDashboard() {

        long preparingCount =
                orderItemRepository.countByStatus(
                        OrderItemStatus.PREPARING);

        long completedCount =
                orderItemRepository.countByStatus(
                        OrderItemStatus.COMPLETED);

        long unavailableDishCount =
                dishRepository.countByIsAvailableFalse();

        return ChefDashboardResponse.builder()
                .preparingCount(preparingCount)
                .completedCount(completedCount)
                .unavailableDishCount(unavailableDishCount)
                .build();
    }
    @Override
    public void requestCancel(Long orderItemId, String reason) {

        OrderItem item = orderItemRepository
                .findById(orderItemId)
                .orElseThrow(
                        () -> new RuntimeException("Order item not found")
                );

        if (item.getStatus() != OrderItemStatus.PREPARING) {
            throw new RuntimeException(
                    "Only preparing dishes can request cancellation"
            );
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException(
                    "Cancel reason is required"
            );
        }

        item.setStatus(OrderItemStatus.CANCELLED);
        item.setCancelReason(reason.trim());
        item.setCancelRequestedAt(LocalDateTime.now());

        // anh xem qua nhé, bên chức năng là set dish status = false của màn hình dish list ấy, thì cập nhật hết các đơn hàng (order item) thành cancelled luôn. vì nó ở bên frontend mà em chưa biết viết như nào nên em viết tạm vào đây nhé
        // chuyển trạng thái của dish luôn vì cancelled chỉ có thể do hết hàng
        Dish unavailableDish = item.getDish();
        unavailableDish.setAvailable(false);
        dishRepository.save(unavailableDish);

        orderItemRepository.save(item);
    }
    @Override
    public List<KitchenOrderResponse> getCompletedOrders() {

        return orderItemRepository
                .findByStatusOrderByCreatedAtAsc(
                        OrderItemStatus.COMPLETED)
                .stream()
                .map(item -> {

                    KitchenOrderResponse response =
                            new KitchenOrderResponse();

                    response.setOrderItemId(item.getId());

                    response.setOrderId(
                            item.getOrder().getId());

                    response.setTableNumber(
                            item.getOrder()
                                    .getTable()
                                    .getTableNumber());

                    response.setDishName(
                            item.getDish().getName());

                    response.setQuantity(
                            item.getQuantity());

                    response.setStatus(
                            item.getStatus());

                    response.setCreatedAt(
                            item.getCreatedAt());

                    return response;
                })
                .toList();
    }


}