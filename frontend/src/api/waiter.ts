import {apiClient} from './client';

// Enums
export type TableStatus = 'AVAILABLE' | 'SERVING' | 'RESERVED';
export type OrderItemStatus = 'PREPARING' | 'COMPLETED' | 'CANCELLED';

// Responses
export type TableDetailResponse = {
    tableId: number;
    tableNumber: string;
    capacity: number;
    status: TableStatus;
};

export type MenuItemResponse = {
    dishId: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryName: string;
};

export type OrderItemResponse = {
    orderItemId: number; // In Java this is Long, using number in TS
    dishName: string;
    status: OrderItemStatus;
    quantity: number;
    unitPrice: number; // BigDecimal -> number
    subTotal: number;
    note: string;
};

export type OrderDetailResponse = {
    orderId: number;
    tableNumber: string;
    createdAt: string; // LocalDateTime string
    orderItems: OrderItemResponse[];
    totalAmountBeforeVat: number;
    vatAmount: number;
    finalAmount: number;
};

export type CreateOrderResponse = {
    orderId: number;
    tableNumber: string;
    message: string;
    itemSummary: string;
    totalAmount: number;
};

export type UpdateOrderResponse = {
    orderId: number;
    tableNumber: string;
    message: string;
    itemSummary: string;
    totalAmount: number;
};

// Requests
export type OrderItemRequest = {
    dishId: number;
    quantity: number;
    note?: string;
};

export type CreateOrderRequest = {
    tableId: number;
    items: OrderItemRequest[];
};

export type UpdateOrderItemRequest = {
    orderItemId?: number | null; // null/undefined if new item
    dishId: number;
    quantity: number;
    note?: string;
};

export type UpdateOrderRequest = {
    items: UpdateOrderItemRequest[];
};

// API calls
export const waiterApi = {
    getTables: () => apiClient.get<TableDetailResponse[]>('/waiter/tables'),

    getMenu: () => apiClient.get<MenuItemResponse[]>('/waiter/menu'),

    createOrder: (data: CreateOrderRequest) =>
        apiClient.post<CreateOrderResponse>('/waiter/orders', data),

    updateOrder: (orderId: number, data: UpdateOrderRequest) =>
        apiClient.put<UpdateOrderResponse>(`/waiter/orders/${orderId}`, data),

    getServingOrders: (tableId: number) =>
        apiClient.get<OrderDetailResponse[]>(`/waiter/detail/${tableId}`),
};
