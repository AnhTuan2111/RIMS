import {apiClient} from './client'

// Enums
export type TableStatus =
    | 'AVAILABLE'
    | 'SERVING'
    | 'RESERVED'

export type OrderItemStatus =
    | 'PREPARING'
    | 'COMPLETED'
    | 'CANCELLED'

export type ReservationStatus =
    | 'QUEUED'
    | 'WAITING'
    | 'COMPLETED'
    | 'CANCELLED'

// Responses
export type TableDetailResponse = {
    tableId: number
    tableNumber: string
    capacity: number
    status: TableStatus
    upcomingReservationTime?: string
    upcomingCustomerName?: string
}

export type MenuItemResponse = {
    dishId: number
    name: string
    description: string
    price: number
    imageUrl: string
    categoryName: string
}

export type OrderItemResponse = {
    orderItemId: number
    dishName: string
    status: OrderItemStatus
    quantity: number
    unitPrice: number
    subTotal: number
    note?: string | null
    chefInternalNote?: string | null
    chefInternalNoteCreatedAt?: string | null
    chefInternalNoteAcknowledgedAt?: string | null
}

export type OrderDetailResponse = {
    orderId: number
    tableNumber: string
    createdAt: string
    orderItems: OrderItemResponse[]
    totalAmountBeforeVat: number
    vatAmount: number
    finalAmount: number
}

export type CreateOrderResponse = {
    orderId: number
    tableNumber: string
    message: string
    totalAmount: number
}

export type UpdateOrderResponse = {
    orderId: number
    tableNumber: string
    message: string
    totalAmount: number
}

// Requests
export type OrderItemRequest = {
    dishId: number
    quantity: number
    note?: string
}

export type CreateOrderRequest = {
    tableId: number
    items: OrderItemRequest[]
}

export type UpdateOrderItemRequest = {
    orderItemId?: number | null
    dishId: number
    quantity: number
    note?: string
}

export type UpdateOrderRequest = {
    items: UpdateOrderItemRequest[]
}

export type CreateReservationRequest = {
    customerName: string
    phone: string
    note?: string
    tableId: number
    reservationTime: string
}

export type ReservationResponse = {
    id?: number
    reservationId?: number
    customerName: string
    phone: string
    note?: string | null
    tableId: number
    tableNumber?: string
    reservationTime: string
    status?: ReservationStatus
}

// API calls
export const waiterApi = {
    getTables: (signal?: AbortSignal) =>
        apiClient.get<TableDetailResponse[]>(
            '/waiter/tables',
            {
                signal,
            },
        ),

    getMenu: (signal?: AbortSignal) =>
        apiClient.get<MenuItemResponse[]>(
            '/waiter/menu',
            {
                signal,
            },
        ),

    createOrder: (data: CreateOrderRequest) =>
        apiClient.post<CreateOrderResponse>(
            '/waiter/orders',
            data,
        ),

    createOrderFromReservation: (
        reservationId: number,
        data: CreateOrderRequest,
    ) =>
        apiClient.post<CreateOrderResponse>(
            `/waiter/reservations/${reservationId}/orders`,
            data,
        ),

    updateOrder: (
        orderId: number,
        data: UpdateOrderRequest,
    ) =>
        apiClient.put<UpdateOrderResponse>(
            `/waiter/orders/${orderId}`,
            data,
        ),

    getServingOrders: (
        tableId: number,
        signal?: AbortSignal,
    ) =>
        apiClient.get<OrderDetailResponse[]>(
            `/waiter/detail/${tableId}`,
            {
                signal,
            },
        ),

    createReservation: (
        data: CreateReservationRequest,
    ) =>
        apiClient.post<string>(
            '/waiter/reservations',
            data,
        ),

    getReservationsByTableAndDate: (
        tableId: number,
        date: string,
        signal?: AbortSignal,
    ) =>
        apiClient.get<ReservationResponse[]>(
            `/waiter/reservation/${tableId}/${date}`,
            {
                signal,
            },
        ),

    getCurrentReservationByTable: (
        tableId: number,
        signal?: AbortSignal,
    ) =>
        apiClient.get<ReservationResponse | null>(
            `/waiter/reservation/detail/${tableId}`,
            {
                signal,
            },
        ),

    getReservationDetail: (
        reservationId: number,
        signal?: AbortSignal,
    ) =>
        apiClient.get<ReservationResponse>(
            `/waiter/reservations/${reservationId}`,
            {
                signal,
            },
        ),

    updateReservation: (
        reservationId: number,
        data: CreateReservationRequest,
    ) =>
        apiClient.put<string>(
            `/waiter/reservations/${reservationId}`,
            data,
        ),

    cancelReservation: (
        reservationId: number,
    ) =>
        apiClient.put<string>(
            `/waiter/reservations/${reservationId}/cancel`,
        ),

    acknowledgeChefInternalNote: (
        orderItemId: number,
    ) =>
        apiClient.put<void>(
            `/waiter/order-items/${orderItemId}/chef-note/acknowledge`,
        ),
}