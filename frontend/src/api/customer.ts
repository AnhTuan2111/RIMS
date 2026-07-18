// src/api/customer.ts

import { apiClient } from './client'
import type { UserResponse } from '../types/auth'

export interface UpdateProfileRequest {
    fullName: string
    email: string
    phone: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

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

// ===== Profile APIs =====
export async function getMyProfile(): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>('/customer/profile')
    return res.data
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>('/customer/profile', data)
    return res.data
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/customer/change-password', data)
}

// ===== Reservation APIs =====
export async function createReservation(data: CustomerCreateReservationRequest): Promise<CustomerReservationResponse> {
    const res = await apiClient.post<CustomerReservationResponse>('/customer/reservations', data)
    return res.data
}

export async function cancelReservation(reservationId: number): Promise<CustomerReservationResponse> {
    const res = await apiClient.delete<CustomerReservationResponse>(`/customer/reservations/${reservationId}/cancel`)
    return res.data
}

export async function checkReservationByDate(date: string): Promise<boolean> {
    const res = await apiClient.get<boolean>('/customer/reservations/check', { params: { date } })
    return res.data
}

export async function getCurrentReservation(): Promise<CustomerReservationResponse[]> {
    const res = await apiClient.get<CustomerReservationResponse[]>('/customer/reservations/current')
    return res.data
}

// ===== Tables API =====
export async function getAvailableTables(): Promise<RestaurantTable[]> {
    const res = await apiClient.get<RestaurantTable[]>('/customer/tables/available')
    return res.data
}