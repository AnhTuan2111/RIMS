package vn.edu.fpt.swp391.g6.rimsapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "invoices")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Invoice
{
    private static final BigDecimal VAT_INCLUSIVE_MULTIPLIER = new BigDecimal("1.10");
    private static final int VND_SCALE = 0;

    @Id
    @Column(name = "invoice_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private BigDecimal finalAmount;

    @Column(name = "restaurant_revenue_amount", precision = 38, scale = 2)
    private BigDecimal restaurantRevenueAmount;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime invoiceDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments;

    @PrePersist
    @PreUpdate
    private void fillRestaurantRevenueAmount()
    {
        if (restaurantRevenueAmount == null && finalAmount != null)
        {
            restaurantRevenueAmount = calculateRestaurantRevenueAmount(finalAmount);
        }
    }

    public static BigDecimal calculateRestaurantRevenueAmount(BigDecimal finalAmount)
    {
        if (finalAmount == null)
        {
            return BigDecimal.ZERO.setScale(VND_SCALE, RoundingMode.HALF_UP);
        }

        return finalAmount.divide(
                VAT_INCLUSIVE_MULTIPLIER,
                VND_SCALE,
                RoundingMode.HALF_UP
        );
    }

    // Thiết lập đơn hàng cho hóa đơn này và đồng bộ hóa liên kết ngược lại từ đơn hàng về hóa đơn
    public void setOrder(Order order)
    {
        this.order = order;
        if (order != null && order.getInvoice() != this)
        {
            order.setInvoice(this); // Thiết lập liên kết ngược lại ở phía Order (tránh vòng lặp vô hạn)
        }
    }

    // Thêm thanh toán vào hóa đơn và tự động thiết lập liên kết ngược lại ở phía Payment
    public void addPayment(Payment payment)
    {
        if (this.payments == null)
        {
            this.payments = new java.util.ArrayList<>();
        }
        this.payments.add(payment);
        payment.setInvoice(this); // Thiết lập mối quan hệ 2 chiều ở phía Payment
    }

    // Xóa thanh toán khỏi hóa đơn và gỡ bỏ liên kết ngược lại ở phía Payment
    public void removePayment(Payment payment)
    {
        if (this.payments != null)
        {
            this.payments.remove(payment);
            payment.setInvoice(null); // Gỡ bỏ mối quan hệ 2 chiều ở phía Payment
        }
    }
}
