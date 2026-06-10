package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.KitchenOrderResponse;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.OrderItemRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.ChefService;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.DishDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChefServiceImpl implements ChefService {

    private final OrderItemRepository orderItemRepository;

    @Override
    public List<KitchenOrderResponse> getKitchenOrders() {

        return orderItemRepository
                //return orderItemRepository.findAll()
                .findByStatus(OrderItemStatus.PREPARING)
                .stream()
                .map(item -> {

                    KitchenOrderResponse response =
                            new KitchenOrderResponse();

                    response.setOrderItemId(
                            item.getOrderItemId());

                    response.setOrderId(
                            item.getOrder().getOrderId());

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

        response.setOrderItemId(item.getOrderItemId());

        response.setTableNumber(
                item.getOrder()
                        .getTable()
                        .getTableNumber());

        response.setDishName(item.getDish().getName());

        response.setDescription(item.getDish().getDescription());

        response.setQuantity(item.getQuantity());

        response.setNote(item.getNote());

        response.setStatus(item.getStatus());

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
}