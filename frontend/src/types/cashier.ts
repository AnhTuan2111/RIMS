
export type TableStatus = 'AVAILABLE' | 'SERVING';
export type OrderStatus = 'SERVING' | 'LOCKED' | 'COMPLETED';
export type PaymentMethodType = 'CASH' | 'QRCODE';

export interface TableDashboardResponse {
    tableId: number;
    tableNumber: string;
    status: TableStatus;
    orderId?: number | null; // SỬA: Đổi từ currentOrderId thành orderId để khớp Java
}

export interface OrderItemResponse {
    dishName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface OrderDetailResponse {
    orderId: number;
    tableName: string; // SỬA: Đổi từ tableNumber thành tableName
    createdAt: string; // Java LocalDateTime sẽ trả về ISO String
    orderItems: OrderItemResponse[]; // SỬA: Đổi từ items thành orderItems

    totalAmountBeforeVat: number;
    vatAmount: number;
    finalAmount: number; // SỬA: Đổi từ totalAmount thành finalAmount
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