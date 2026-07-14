package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagedInvoiceResponse
{
    private List<CashierInvoiceSummaryResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}