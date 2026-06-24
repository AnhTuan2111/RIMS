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
