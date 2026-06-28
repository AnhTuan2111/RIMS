package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.Data;

import java.math.BigDecimal;


@Data
public class InvoiceItemResponse
{

    private String dishName;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal amount;
}