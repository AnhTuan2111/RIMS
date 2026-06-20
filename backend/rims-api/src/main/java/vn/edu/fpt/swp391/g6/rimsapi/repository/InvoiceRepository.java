package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = {"order", "order.orderItems", "order.orderItems.dish", "order.table"})
    Optional<Invoice> findWithOrderAndItemsById(Long id);
}