package vn.edu.fpt.swp391.g6.rimsapi.service;


import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceHistoryPageResponse;


public interface InvoiceService
{

    InvoiceHistoryPageResponse getInvoiceHistory(int page, int pageSize);

    InvoiceDetailResponse getInvoiceDetail(Long invoiceId);
}
