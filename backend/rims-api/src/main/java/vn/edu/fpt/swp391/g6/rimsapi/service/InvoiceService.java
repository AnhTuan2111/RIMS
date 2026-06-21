package vn.edu.fpt.swp391.g6.rimsapi.service;


import vn.edu.fpt.swp391.g6.rimsapi.dto.response.InvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.InvoiceHistoryResponse;

import java.util.List;

public interface InvoiceService {

    List<InvoiceHistoryResponse> getInvoiceHistory();

    InvoiceDetailResponse getInvoiceDetail(Long invoiceId);
}