package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;


public interface InvoicePdfService
{
    byte[] generateInvoicePdf(Invoice invoice);
}