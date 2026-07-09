import { apiClient } from './client';
import type {
    TableDashboardResponse,
    OrderDetailResponse,
    PaymentRequest,
    PaymentResponse,
    VNPayResponse,
    PagedInvoiceResponse,
    InvoiceDetail
} from '../types/cashier';

export const cashierApi = {
    // API 1: Lấy danh sách bàn
    getTables: () =>
        apiClient.get<TableDashboardResponse[]>('/cashier/tables'),

    // API 2: Lấy chi tiết đơn hàng
    getOrderDetail: (orderId: number) =>
        apiClient.get<OrderDetailResponse>(`/cashier/orders/${orderId}`),

    // API 3: LOCKED trước khi thanh toán
    processPaymentLock: (orderId: number, request: PaymentRequest) =>
        apiClient.post<PaymentResponse>(`/cashier/orders/${orderId}/payment`, request),

    // API 4: Hoàn tất thanh toán tiền mặt
    completeCashPayment: (orderId: number, request: PaymentRequest) =>
        apiClient.post<PaymentResponse>(`/cashier/orders/${orderId}/complete-cash`, request),

    // API 5: Lấy mã QR VNPay
    getVNPayQrCode: (orderId: number, customerId?: number | null, pointsUsed?: number) =>
        apiClient.get<VNPayResponse>(`/cashier/orders/${orderId}/vnpay-qr`, {
            params: { customerId: customerId ?? undefined, pointsUsed }
        }),

    //API 6 : dowloand invoice pdf
    downloadInvoicePdf: (invoiceId: number) =>
        apiClient.get(`/cashier/invoices/${invoiceId}/pdf`, {
            responseType: 'blob'
        }),

    searchCustomer: (phone: string) =>
        apiClient.get(`/cashier/customers/search?phone=${phone}`),

    createCustomerFast: (data: { fullName: string, phone: string, email: string }) =>
        apiClient.post('/cashier/customers/create', data),

    getTodayInvoices: (params: {
        page: number; size: number;
        tableNumber?: string; keyword?: string; paymentMethod?: string; invoiceCode?: string;
    }) =>
        apiClient.get<PagedInvoiceResponse>('/cashier/invoices/today', { params }),

    getInvoiceDetail: (invoiceId: number) =>
        apiClient.get<InvoiceDetail>(`/cashier/invoices/${invoiceId}`),

    unlockOrder: (orderId: number) =>
        apiClient.post<PaymentResponse>(`/cashier/orders/${orderId}/unlock`)
};