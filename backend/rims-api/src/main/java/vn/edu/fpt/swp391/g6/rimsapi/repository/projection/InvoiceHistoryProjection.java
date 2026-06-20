package vn.edu.fpt.swp391.g6.rimsapi.repository.projection;

import vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface InvoiceHistoryProjection {

    Long getInvoiceId();

    Long getOrderId();

    String getTableNumber();

    PaymentMethod getPaymentMethod();

    BigDecimal getAmount();

    LocalDateTime getPaymentDate();
}

