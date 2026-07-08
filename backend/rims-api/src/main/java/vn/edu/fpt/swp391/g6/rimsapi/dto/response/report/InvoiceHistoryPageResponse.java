package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceHistoryPageResponse
{

    private List<InvoiceHistoryResponse> items;

    private int page;

    private int pageSize;

    private long totalItems;

    private int totalPages;
}
