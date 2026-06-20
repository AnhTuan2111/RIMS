package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.BestSellingDishProjection;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import vn.edu.fpt.swp391.g6.rimsapi.repository.projection.InvoiceHistoryProjection;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>
{
    //Get total Revenue
    @Query("""
            SELECT COALESCE(SUM(i.finalAmount),0)
            FROM Invoice i
            """)
    BigDecimal getTotalRevenue();

    //Get revenue according period
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


    //Get invoice history for a specific table.
    @Query("""
            SELECT
                i.invoiceId as invoiceId,
                o.orderId as orderId,
                t.tableNumber as tableNumber,
                p.paymentMethod as paymentMethod,
                i.finalAmount as amount,
                i.invoiceDate as paymentDate
            FROM Invoice i
            JOIN i.order o
            JOIN o.table t
            JOIN i.payments p
            WHERE p.isSuccess = true
            ORDER BY i.invoiceDate DESC
            """)
    List<InvoiceHistoryProjection> getInvoiceHistory();


    @EntityGraph(attributePaths = {"order", "order.orderItems", "order.orderItems.dish", "order.table"})
    Optional<Invoice> findWithOrderAndItemsById(Long id);
}