
export type TableStatus = 'AVAILABLE' | 'SERVING';
export type OrderStatus = 'SERVING' | 'LOCKED' | 'COMPLETED';
export type PaymentMethodType = 'CASH' | 'QRCODE';

export interface TableDashboardResponse {
    tableId: number;
    tableNumber: string;
    status: TableStatus;
    orderId?: number | null;
}

export interface OrderItemResponse {
    dishName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface OrderDetailResponse {
    orderId: number;
    tableNumber: string;
    createdAt: string;
    orderItems: OrderItemResponse[];

    totalAmountBeforeVat: number;
    vatAmount: number;
    finalAmount: number;
}

export interface PaymentRequest {
    paymentMethod: PaymentMethodType;
    amountPaid: number;

    customerId?: number | null;
    pointsUsed?: number;
}

export interface PaymentResponse {
    message: string;
    success: boolean;
    invoiceId: number;
    amountPaid: number;
    excessAmount: number;
    finalAmount: number;
    customerName: string | null;
    pointsUsed: number | null;
    pointsEarned: number | null;
    paymentMethod: string;
    autoClosedNoPayment?: boolean
}

export interface VNPayResponse {
    paymentUrl: string;
    message: string;
    success: boolean;
}

export interface InvoiceSummary {
    invoiceId: number;
    tableNumber: string;
    invoiceDate: string;
    finalAmount: number;
    customerName: string | null;
    paymentMethod: string | null;
    pointsUsed: number | null;
    pointsEarned: number | null;
}

export interface PagedInvoiceResponse {
    content: InvoiceSummary[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface InvoiceItemLine {
    dishName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface InvoiceDetail {
    invoiceId: number;
    tableNumber: string;
    invoiceDate: string;
    items: InvoiceItemLine[];
    totalBeforeVat: number;
    vatAmount: number;
    finalAmount: number;
    paymentMethod: string | null;
    amountPaid: number;
    excessAmount: number;
    customerName: string | null;
    pointsUsed: number | null;
    pointsEarned: number | null;
}