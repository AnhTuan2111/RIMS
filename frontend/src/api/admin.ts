import { apiClient } from './client'
import type { UserResponse } from '../types/auth'

export interface CreateCustomerRequest {
    username: string
    email: string
    phone: string
    password: string
}

export interface CreateStaffRequest {
    username: string
    email: string
    phone: string
    role: string
    password: string
}

export interface UpdateAccountRequest {
    fullName: string
    email: string
    phone: string
}

export interface SetAccountStatusRequest {
    active: boolean
}

// Staff accounts
export async function getStaffAccounts(): Promise<UserResponse[]> {
    const res = await apiClient.get<UserResponse[]>('/admin/user/staff')
    return res.data
}

// Customer accounts
export async function getCustomerAccounts(): Promise<UserResponse[]> {
    const res = await apiClient.get<UserResponse[]>('/admin/user/customer')
    return res.data
}

export async function getAccountDetail(id: number): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>(`/admin/user/${id}`)
    return res.data
}

export async function createCustomer(data: CreateCustomerRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/customer/new', data)
    return res.data
}

export async function createStaff(data: CreateStaffRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/staff/new', data)
    return res.data
}

export async function updateAccount(id: number, data: UpdateAccountRequest): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>(`/admin/user/${id}`, data)
    return res.data
}

export async function setAccountStatus(id: number, active: boolean): Promise<void> {
    await apiClient.patch(`/admin/user/${id}/status`, { active })
}
