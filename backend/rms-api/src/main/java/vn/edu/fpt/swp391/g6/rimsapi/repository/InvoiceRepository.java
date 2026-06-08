package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;

import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("""
    SELECT COALESCE(SUM(i.finalAmount),0)
    FROM Invoice i
    """)
    BigDecimal getTotalRevenue();

    @Query("""
    SELECT COALESCE(SUM(i.finalAmount),0)
    FROM Invoice i
    WHERE i.invoiceDate BETWEEN :startDate AND :endDate
    """)
    BigDecimal getRevenueBetween(
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    //Best selling.
    @Query("""
SELECT
    d.name as dishName,
    SUM(oi.quantity) as totalQuantity,
    SUM(oi.subTotal) as totalRevenue
FROM Invoice i
JOIN i.order o
JOIN o.orderItems oi
JOIN oi.dish d
WHERE
    i.invoiceDate BETWEEN :startDate AND :endDate
GROUP BY
    d.name
ORDER BY
    SUM(oi.quantity) DESC
""")
    List<BestSellingDishProjection> getBestSellingDishes(
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );



}
