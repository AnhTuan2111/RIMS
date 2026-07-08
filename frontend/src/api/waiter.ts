import {apiClient} from './client';

// Enums
export type TableStatus = 'AVAILABLE' | 'SERVING' | 'RESERVED';
export type OrderItemStatus = 'PREPARING' | 'COMPLETED' | 'CANCELLED';
export type ReservationStatus = 'QUEUED' | 'WAITING' | 'COMPLETED' | 'CANCELLED';

// Responses
export type TableDetailResponse = {
    tableId: number;
    tableNumber: string;
    capacity: number;
    status: TableStatus;
    upcomingReservationTime?: string;
    upcomingCustomerName?: string;
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
    totalAmount: number;
};

export type UpdateOrderResponse = {
    orderId: number;
    tableNumber: string;
    message: string;
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

export type CreateReservationRequest = {
    customerName: string;
    phone: string;
    note?: string;
    tableId: number;
    reservationTime: string; // ISO LocalDateTime string e.g. "2026-07-07T18:00:00"
};

// API calls
export const waiterApi = {
    getTables: () => apiClient.get<TableDetailResponse[]>('/waiter/tables'),

    getMenu: () => apiClient.get<MenuItemResponse[]>('/waiter/menu'),

    createOrder: (data: CreateOrderRequest) =>
        apiClient.post<CreateOrderResponse>('/waiter/orders', data),

    createOrderFromReservation: (reservationId: number, data: CreateOrderRequest) =>
        apiClient.post<CreateOrderResponse>(`/waiter/reservations/${reservationId}/orders`, data),

    updateOrder: (orderId: number, data: UpdateOrderRequest) =>
        apiClient.put<UpdateOrderResponse>(`/waiter/orders/${orderId}`, data),

    getServingOrders: (tableId: number) =>
        apiClient.get<OrderDetailResponse[]>(`/waiter/detail/${tableId}`),

    createReservation: (data: CreateReservationRequest) =>
        apiClient.post<string>('/waiter/reservations', data),

    getReservationsByTableAndDate: (tableId: number, date: string) =>
        apiClient.get<any[]>(`/waiter/reservation/${tableId}/${date}`),

    getCurrentReservationByTable: (tableId: number) =>
        apiClient.get<any>(`/waiter/reservation/detail/${tableId}`),

    getReservationDetail: (resId: number) =>
        apiClient.get<any>(`/waiter/reservations/${resId}`),

    updateReservation: (resId: number, data: CreateReservationRequest) =>
        apiClient.put<string>(`/waiter/reservations/${resId}`, data),

    cancelReservation: (resId: number) =>
        apiClient.put<string>(`/waiter/reservations/${resId}/cancel`),
};
