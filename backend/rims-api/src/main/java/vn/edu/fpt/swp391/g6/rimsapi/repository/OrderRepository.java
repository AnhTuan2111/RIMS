package vn.edu.fpt.swp391.g6.rimsapi.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Order;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long>
{

    List<Order> findByStatusIn(List<OrderStatus> statuses);

    List<Order> findByStatusAndInvoiceIsNullAndCreatedAtBefore(OrderStatus status, LocalDateTime cutoff);

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

    /**
     * Khoá đơn hàng để ghi tiền.
     *
     * <p>KHÔNG có JOIN FETCH ở đây, dù tên hàm nói "WithItems". Khoá bi quan
     * cộng với join fetch một collection là tổ hợp Hibernate không dựng nổi:
     * nó phải xác định bảng cho MỌI quan hệ của Order để trải khoá ra, kể cả
     * quan hệ một-một {@code invoice} — thứ vốn EAGER theo mặc định của JPA khi
     * dùng {@code mappedBy} — và nó ném
     * "Unable to determine TableReference (`invoices`) for `orders.invoice`".
     * Hậu quả: MỌI lần thanh toán tiền mặt đều trả 500.
     *
     * <p>Không mất gì khi bỏ join fetch: hàm gọi nó đang ở trong một giao dịch,
     * nên {@code order.getOrderItems()} nạp bình thường ngay sau đó. Đổi lại
     * một truy vấn nữa, lấy về một luồng thanh toán chạy được.
     *
     * <p>Giữ nguyên tên hàm để không phải sửa nơi gọi, và vì nó vẫn đúng với
     * thứ người gọi nhận được.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findOrderForUpdateWithItems(@Param("id") Long orderId);

    List<Order> findByStatusAndLockedAtBefore(OrderStatus status, LocalDateTime deadline);
}
