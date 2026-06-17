import { apiClient } from './client';
import type {
    TableDashboardResponse,
    OrderDetailResponse,
    PaymentRequest,
    PaymentResponse,
    VNPayResponse
} from '../types/cashier';

export const cashierApi = {
    // API 1: Lấy danh sách bàn
    getTables: () =>
        apiClient.get<TableDashboardResponse[]>('/cashier/tables'),

    // API 2: Lấy chi tiết đơn hàng
    getOrderDetail: (orderId: number) =>
        apiClient.get<OrderDetailResponse>(`/cashier/orders/${orderId}`),

    // API 3: Chốt đơn (LOCKED) trước khi thanh toán
    processPaymentLock: (orderId: number, request: PaymentRequest) =>
        apiClient.post<PaymentResponse>(`/cashier/orders/${orderId}/payment`, request),

    // API 5: Hoàn tất thanh toán tiền mặt
    completeCashPayment: (orderId: number, request: PaymentRequest) =>
        apiClient.post<PaymentResponse>(`/cashier/orders/${orderId}/complete-cash`, request),

    // API 6: Lấy mã QR VNPay
    getVNPayQrCode: (orderId: number) =>
        apiClient.get<VNPayResponse>(`/cashier/orders/${orderId}/vnpay-qr`),

    // API 7: Tải hóa đơn PDF
    downloadInvoicePdf: (invoiceId: number) =>
        apiClient.get(`/cashier/invoices/${invoiceId}/pdf`, {
            responseType: 'blob'
        })
};