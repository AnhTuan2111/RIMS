package vn.edu.fpt.swp391.g6.rimsapi.entity;

import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "payments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Payment
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @ManyToOne
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private BigDecimal amount;

    @Column(name = "is_success")
    private boolean isSuccess;

    @CreatedDate
    @Column(name = "payment_date", nullable = false, updatable = false)
    private LocalDateTime paymentDate;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentTransaction> transactions;

    // Thêm giao dịch vào thanh toán và tự động thiết lập liên kết ngược lại ở phía PaymentTransaction
    public void addTransaction(PaymentTransaction transaction) {
        if (this.transactions == null) {
            this.transactions = new java.util.ArrayList<>();
        }
        this.transactions.add(transaction);
        transaction.setPayment(this); // Thiết lập mối quan hệ 2 chiều ở phía PaymentTransaction
    }

    // Xóa giao dịch khỏi thanh toán và gỡ bỏ liên kết ngược lại ở phía PaymentTransaction
    public void removeTransaction(PaymentTransaction transaction) {
        if (this.transactions != null) {
            this.transactions.remove(transaction);
            transaction.setPayment(null); // Gỡ bỏ mối quan hệ 2 chiều ở phía PaymentTransaction
        }
    }
}
