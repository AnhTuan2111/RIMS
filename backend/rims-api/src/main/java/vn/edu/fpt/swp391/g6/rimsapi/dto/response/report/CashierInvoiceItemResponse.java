package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CashierInvoiceItemResponse
{
    private String dishName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subTotal;
}