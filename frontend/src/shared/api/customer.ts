import {apiClient} from './client'

// ===== Reservation Types =====
export interface CustomerCreateReservationRequest {
    customerName: string
    phone: string
    reservationTime: string
    note?: string
    tableId: number
}

export interface CustomerReservationResponse {
    id: number
    customerName: string
    phone: string
    reservationTime: string
    note: string | null
    status: 'QUEUED' | 'WAITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    tableNumber: string
    capacity: number
    tableStatus: string
    createdAt: string
    updatedAt: string
}

export interface RestaurantTable {
    id: number
    tableNumber: string
    capacity: number
    status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED'
}

export interface TimeRangeResponse {
    start: string
    end: string
}

// ===== Reservation APIs =====
export async function createReservation(
    data: CustomerCreateReservationRequest,
): Promise<CustomerReservationResponse> {
    const response = await apiClient.post<CustomerReservationResponse>(
        '/customer/reservations',
        data,
    )

    return response.data
}

export async function cancelReservation(
    reservationId: number,
): Promise<CustomerReservationResponse> {
    const response = await apiClient.delete<CustomerReservationResponse>(
        `/customer/reservations/${reservationId}/cancel`,
    )

    return response.data
}

export async function getCurrentReservation(
    signal?: AbortSignal,
): Promise<CustomerReservationResponse[]> {
    const response = await apiClient.get<CustomerReservationResponse[]>(
        '/customer/reservations/current',
        {
            signal,
        },
    )

    return response.data
}

// ===== Tables API =====
export async function getAvailableTables(
    signal?: AbortSignal,
): Promise<RestaurantTable[]> {
    const response = await apiClient.get<RestaurantTable[]>(
        '/customer/tables/available',
        {
            signal,
        },
    )

    return response.data
}

export async function getBlockedTimeSlots(
    tableId: number,
    date: string,
    signal?: AbortSignal,
): Promise<TimeRangeResponse[]> {
    const response = await apiClient.get<TimeRangeResponse[]>(
        `/customer/tables/${tableId}/blocked-slots`,
        {
            params: {
                date,
            },
            signal,
        },
    )

    return response.data
}
