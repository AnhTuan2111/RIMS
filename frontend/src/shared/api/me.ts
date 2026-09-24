import {apiClient} from './client'
import type {UserResponse} from '@/shared/types/auth'

export interface UpdateProfileRequest {
    username: string
    fullName: string
    email: string
    phone: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

/*
 * Hồ sơ của chính người đang đăng nhập.
 *
 * Ba hàm này từng nằm trong customer.ts và gọi /rims/customer/**, mà nhánh đó
 * chỉ cho vai trò CUSTOMER đi qua — nên Bếp, Phục vụ, Thu ngân và cả Quản trị
 * đều nhận 403 khi muốn đổi mật khẩu của chính mình. Màn Hồ sơ phải lách bằng
 * endpoint của Quản trị, thứ mà ba vai trò kia cũng không được phép gọi.
 */

export async function getMyProfile(signal?: AbortSignal): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/me/profile', {signal})

    return response.data
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>('/me/profile', data)

    return response.data
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/me/change-password', data)
}
