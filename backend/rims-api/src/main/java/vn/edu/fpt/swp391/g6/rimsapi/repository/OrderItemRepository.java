package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long>
{

    List<OrderItem> findByStatusOrderByCreatedAtAsc(OrderItemStatus status);

    //lọc món hủy chỉ trong khoảng thời gian (dùng cho "Đơn đã hủy" của Chef — chỉ xem trong ngày)
    List<OrderItem> findByStatusAndCreatedAtBetweenOrderByCreatedAtAsc(OrderItemStatus status, LocalDateTime start, LocalDateTime end);

    long countByStatus(OrderItemStatus status);
}