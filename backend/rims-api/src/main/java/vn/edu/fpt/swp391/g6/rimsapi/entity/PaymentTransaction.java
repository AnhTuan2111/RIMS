package vn.edu.fpt.swp391.g6.rimsapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;


@Entity
@Table(name = "payment_transaction")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class PaymentTransaction
{

    @Id
    @Column(name = "transaction_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    private String transactionCode;

    private String gateway;

    @Lob
    private String gatewayResponse;

    @Column(name = "is_success")
    private boolean isSuccess;

    @CreatedDate
    @Column(name = "transaction_date", nullable = false, updatable = false)
    private LocalDateTime transactionDate;
}
