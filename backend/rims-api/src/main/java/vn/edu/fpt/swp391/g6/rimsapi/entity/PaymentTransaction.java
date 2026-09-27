package vn.edu.fpt.swp391.g6.rimsapi.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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
    private Long id;

    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(nullable = false)
    private String transactionCode;

    private String gateway;

    /**
     * Nguyên văn phản hồi của cổng thanh toán, giữ lại để đối chiếu khi có
     * tranh chấp giao dịch. Dài bao nhiêu là do cổng quyết định, nên không đặt
     * {@code length}.
     *
     * <p>Trước đây dùng {@code @Lob}. Trên PostgreSQL, {@code @Lob String} không
     * thành {@code text} mà thành {@code oid} — một con trỏ sang bảng hệ thống
     * {@code pg_largeobject}. Kiểu đó đọc ghi phải qua Large Object API và nằm
     * trong một giao dịch, xoá dòng cha KHÔNG xoá phần nội dung nên dữ liệu rác
     * đọng lại, và các công cụ CSDL hiện ra một con số thay vì chuỗi.
     * {@code LONG32VARCHAR} nói đúng ý muốn — "chuỗi dài không giới hạn" — và
     * mỗi dialect tự chọn kiểu của mình: {@code text} trên PostgreSQL,
     * {@code varchar(max)} trên SQL Server.
     */
    @JdbcTypeCode(SqlTypes.LONG32VARCHAR)
    @Column(nullable = false)
    private String gatewayResponse;

    private boolean isSuccess;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime transactionDate;
}
