package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.InvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.InvoiceHistoryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.InvoiceService;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/history")
    public List<InvoiceHistoryResponse> getInvoiceHistory() {
        return invoiceService.getInvoiceHistory();
    }

    @GetMapping("/{invoiceId}")
    public InvoiceDetailResponse getInvoiceDetail(
            @PathVariable Long invoiceId
    ) {
        return invoiceService.getInvoiceDetail(invoiceId);
    }
}