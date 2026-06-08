package vn.edu.fpt.swp391.g6.rimsapi.repository;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

}
