package vn.edu.fpt.swp391.g6.rimsapi.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.DailyRevenueProjection;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.InvoiceHistoryProjection;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>
{
    //Get total Revenue
    @Query("""
            SELECT COALESCE(SUM(i.restaurantRevenueAmount),0)
            FROM Invoice i
            """)
    BigDecimal getTotalRevenue();

    //Get revenue according period
    @Query("""
            SELECT COALESCE(SUM(i.restaurantRevenueAmount),0)
            FROM Invoice i
            WHERE i.invoiceDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getRevenueBetween(
            LocalDateTime startDate,
            LocalDateTime endDate);

    @Query(value = """
            SELECT
                CAST(i.invoice_date AS date) AS revenueDate,
                COALESCE(SUM(i.restaurant_revenue_amount), 0) AS revenue
            FROM invoices i
            WHERE i.invoice_date BETWEEN :startDate AND :endDate
            GROUP BY CAST(i.invoice_date AS date)
            ORDER BY CAST(i.invoice_date AS date)
            """, nativeQuery = true)
    List<DailyRevenueProjection> getDailyRevenueBetween(
            LocalDateTime startDate,
            LocalDateTime endDate);

    //Best selling.
    @Query("""
            SELECT
                d.name as dishName,
                d.imageUrl as imageUrl,
                SUM(oi.quantity) as totalQuantity,
                SUM(oi.subTotal) as totalRevenue
            FROM Invoice i
            JOIN i.order o
            JOIN o.orderItems oi
            JOIN oi.dish d
            WHERE
                i.invoiceDate BETWEEN :startDate AND :endDate
                AND (:categoryId IS NULL OR d.category.id = :categoryId)
            GROUP BY
                d.id,
                d.name,
                d.imageUrl
            ORDER BY
                SUM(oi.quantity) DESC,
                SUM(oi.subTotal) DESC
            """)
    List<BestSellingDishProjection> getBestSellingDishes(
            LocalDateTime startDate,
            LocalDateTime endDate,
            Integer categoryId,
            Pageable pageable);

    @Query("""
            SELECT o.createdAt
            FROM Invoice i
            JOIN i.order o
            WHERE o.createdAt BETWEEN :startDate AND :endDate
            """)
    List<LocalDateTime> getPaidOrderCreatedTimesBetween(
            LocalDateTime startDate,
            LocalDateTime endDate);

    //Get invoice history, có filter theo bàn / phương thức / mã HĐ / tên-SĐT khách hàng.
    /**
     * Lịch sử hoá đơn, bốn ô lọc đều có thể để trống.
     *
     * <p>ĐỪNG BỎ {@code CAST(:tham_số AS string)} vì thấy nó dư. Nó là thứ giữ
     * cho màn này chạy được trên PostgreSQL: khi ô lọc để trống, tham số là
     * {@code null} và trình điều khiển gửi sang một NULL không kèm kiểu.
     * PostgreSQL phải tự suy ra kiểu từ ngữ cảnh, mà trong
     * {@code lower('%' || ? || '%')} thì toán tử {@code ||} có nhiều phiên bản
     * nên nó đoán ra {@code bytea} rồi báo
     * {@code function lower(bytea) does not exist} — lỗi 500 ngay ở lần mở màn
     * hình, vì không lọc gì mới là trường hợp mặc định.
     *
     * <p>CAST nói thẳng kiểu của tham số nên không còn gì phải đoán. Chỉ cần
     * cho tham số CHUỖI; {@code :paymentMethod} (enum) và {@code :categoryId}
     * (số) thì Hibernate đã gửi kèm kiểu sẵn.
     *
     * <p>Khối WHERE này lặp lại y nguyên ở countQuery — sửa một chỗ thì phải
     * sửa cả chỗ kia, nếu không số trang sẽ lệch với dữ liệu trả về.
     */
    @Query(value = """
            SELECT
                i.id as invoiceId,
                o.id as orderId,
                t.tableNumber as tableNumber,
                p.paymentMethod as paymentMethod,
                i.finalAmount as amount,
                i.invoiceDate as paymentDate
            FROM Invoice i
            JOIN i.order o
            JOIN o.table t
            JOIN i.payments p
            LEFT JOIN User u ON u.id = o.pendingCustomerId
            WHERE (CAST(:tableNumber AS string) IS NULL OR LOWER(t.tableNumber) LIKE LOWER(CONCAT('%', CAST(:tableNumber AS string), '%')))
              AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod)
              AND (CAST(:keyword AS string) IS NULL OR CAST(i.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%'))
              AND (CAST(:customerKeyword AS string) IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:customerKeyword AS string), '%')) OR u.phone LIKE CONCAT('%', CAST(:customerKeyword AS string), '%'))
            ORDER BY i.invoiceDate DESC
            """, countQuery = """
            SELECT COUNT(i)
            FROM Invoice i
            JOIN i.order o
            JOIN o.table t
            JOIN i.payments p
            LEFT JOIN User u ON u.id = o.pendingCustomerId
            WHERE (CAST(:tableNumber AS string) IS NULL OR LOWER(t.tableNumber) LIKE LOWER(CONCAT('%', CAST(:tableNumber AS string), '%')))
              AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod)
              AND (CAST(:keyword AS string) IS NULL OR CAST(i.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%'))
              AND (CAST(:customerKeyword AS string) IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:customerKeyword AS string), '%')) OR u.phone LIKE CONCAT('%', CAST(:customerKeyword AS string), '%'))
            """)
    Page<InvoiceHistoryProjection> getInvoiceHistory(
            @Param("tableNumber") String tableNumber,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("keyword") String keyword,
            @Param("customerKeyword") String customerKeyword,
            Pageable pageable);

    @EntityGraph(attributePaths = {"order", "order.orderItems", "order.orderItems.dish", "order.table"})
    Optional<Invoice> findWithOrderAndItemsById(Long id);

    List<Invoice> findByRestaurantRevenueAmountIsNull();

    List<Invoice> findByInvoiceDateBetween(LocalDateTime start, LocalDateTime end);
}
