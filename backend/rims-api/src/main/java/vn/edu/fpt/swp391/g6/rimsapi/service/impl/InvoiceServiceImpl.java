package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceHistoryResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceItemResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.InvoiceService;

import java.util.List;


@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService
{

    private final InvoiceRepository invoiceRepository;

    @Override
    public List<InvoiceHistoryResponse> getInvoiceHistory()
    {

        return invoiceRepository
                .getInvoiceHistory()
                .stream()
                .map(row -> new InvoiceHistoryResponse(
                        row.getInvoiceId(),
                        row.getOrderId(),
                        row.getTableNumber(),
                        row.getPaymentMethod(),
                        row.getAmount(),
                        row.getPaymentDate()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getInvoiceDetail(Long invoiceId)
    {

        Invoice invoice = invoiceRepository
                .findById(invoiceId)
                .orElseThrow(() ->
                        new RuntimeException("Invoice not found"));

        InvoiceDetailResponse response =
                new InvoiceDetailResponse();

        response.setInvoiceId(
                invoice.getId()
        );

        response.setOrderId(
                invoice.getOrder()
                        .getId()
        );

        response.setTableNumber(
                invoice.getOrder()
                        .getTable()
                        .getTableNumber()
        );

        response.setFinalAmount(
                invoice.getFinalAmount()
        );

        response.setInvoiceDate(
                invoice.getInvoiceDate()
        );

        response.setPaymentMethod(
                invoice.getPayments().isEmpty()
                        ? "UNKNOWN"
                        : invoice.getPayments()
                        .get(0)
                        .getPaymentMethod()
                        .name()
        );

        List<InvoiceItemResponse> items =
                invoice.getOrder()
                        .getOrderItems()
                        .stream()
                        .map(orderItem ->
                        {

                            InvoiceItemResponse item =
                                    new InvoiceItemResponse();

                            item.setDishName(
                                    orderItem.getDish()
                                            .getName()
                            );

                            item.setQuantity(
                                    orderItem.getQuantity()
                            );

                            item.setUnitPrice(
                                    orderItem.getUnitPrice()
                            );

                            item.setAmount(
                                    orderItem.getSubTotal()
                            );

                            return item;
                        })
                        .toList();

        response.setItems(items);

        return response;
    }
}