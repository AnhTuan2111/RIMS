export type TableStatus = 'AVAILABLE' | 'SERVING';
export type OrderStatus = 'SERVING' | 'LOCKED' | 'COMPLETED';

// Đồng bộ với vn.edu.fpt.swp391.g6.rimsapi.enums.PaymentMethod
export type PaymentMethodType = 'CASH' | 'QRCODE';

export interface TableDashboardResponse {
    tableId: number;
    tableNumber: string;
    capacity: number;
    status: TableStatus;
    currentOrderId?: number | null; // ID đơn hàng nếu bàn đang SERVING
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
    status: OrderStatus;
    items: OrderItemResponse[];
    totalAmount: number;
}

// Khớp với PaymentRequest.java
export interface PaymentRequest {
    paymentMethod: PaymentMethodType;
    amountPaid: number;
}

// Khớp với PaymentResponse.java
export interface PaymentResponse {
    message: string;
    success: boolean;
    invoiceId: number;
    amountPaid: number;
    excessAmount: number;
}

// Khớp với VNPayResponse.java
export interface VNPayResponse {
    paymentUrl: string;
    message: string;
    success: boolean;
}