package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;

import java.util.List;
import java.util.Optional;


public interface OrderRepository extends JpaRepository<Order, Long>
{

    List<Order> findByStatus(OrderStatus status);

    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.table t
            LEFT JOIN FETCH o.orderItems oi
            LEFT JOIN FETCH oi.dish d
            WHERE o.id = :orderId
            """)
    Optional<Order> findOrderWithDetailsById(@Param("orderId") Long orderId);

    @Query("""
            SELECT DISTINCT o FROM Order o
            JOIN FETCH o.table t
            LEFT JOIN FETCH o.orderItems oi
            LEFT JOIN FETCH oi.dish d
            WHERE o.status = SERVING 
            AND t.id = :tableID
            """)
    List<Order> findServingOrdersWithDetails(@Param("tableID") int tableID);
}