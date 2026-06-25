
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
    tableName: string;
    createdAt: string;
    orderItems: OrderItemResponse[];

    totalAmountBeforeVat: number;
    vatAmount: number;
    finalAmount: number;
}

export interface PaymentRequest {
    paymentMethod: PaymentMethodType;
    amountPaid: number;
}

export interface PaymentResponse {
    message: string;
    success: boolean;
    invoiceId: number;
    amountPaid: number;
    excessAmount: number;
}

export interface VNPayResponse {
    paymentUrl: string;
    message: string;
    success: boolean;
}