import axiosClient from "./axiosClient";

export const invoiceApi = {
    getInvoiceHistory: () =>
        axiosClient.get("/invoices/history"),

    getInvoiceDetail: (invoiceId: number) =>
        axiosClient.get(`/invoices/${invoiceId}`),
};