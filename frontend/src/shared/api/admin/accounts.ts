/**
 * shared/api/admin/accounts.ts
 * User CRUD, staff/customer account management, and profile endpoints.
 * Split from the original 637-line admin/index.ts god file.
 */

import {apiClient} from '../client'
import type {UserResponse} from '@/shared/types/auth'
import type {
    CreateCustomerRequest,
    CreateStaffRequest,
    GetAccountsParams,
    PageResponse,
    SetAccountStatusRequest,
    UpdateAccountRequest,
    UpdateOwnProfileRequest,
    UserProfileResponse,
} from '@/shared/types/admin'

// Re-export types so callers can import from this file alone
export type {
    CreateCustomerRequest,
    CreateStaffRequest,
    GetAccountsParams,
    PageResponse,
    SetAccountStatusRequest,
    UpdateAccountRequest,
    UpdateOwnProfileRequest,
    UserProfileResponse,
}

/** Returns a paginated list of staff accounts */
export async function getStaffAccounts(
    params: GetAccountsParams = {},
    signal?: AbortSignal,
): Promise<PageResponse<UserResponse>> {
    const res = await apiClient.get<PageResponse<UserResponse>>('/admin/user/staff', {
        params,
        signal,
    })
    return res.data
}

/** Returns a paginated list of customer accounts */
export async function getCustomerAccounts(
    params: GetAccountsParams = {},
    signal?: AbortSignal,
): Promise<PageResponse<UserResponse>> {
    const res = await apiClient.get<PageResponse<UserResponse>>('/admin/user/customer', {
        params,
        signal,
    })
    return res.data
}

/** Returns a single account by ID */
export async function getAccountDetail(
    id: number,
    signal?: AbortSignal,
): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>(`/admin/user/${id}`, {signal})
    return res.data
}

/** Creates a new customer account */
export async function createCustomer(data: CreateCustomerRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/customer/new', data)
    return res.data
}

/** Creates a new staff account */
export async function createStaff(data: CreateStaffRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/staff/new', data)
    return res.data
}

/** Updates any account (admin use) */
export async function updateAccount(
    id: number,
    data: UpdateAccountRequest,
): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>(`/admin/user/${id}`, data)
    return res.data
}

/** Activates or deactivates an account */
export async function setAccountStatus(id: number, active: boolean): Promise<void> {
    await apiClient.patch(`/admin/user/${id}/status`, {
        active,
    } satisfies SetAccountStatusRequest)
}

/**
 * Đặt lại mật khẩu của một tài khoản về mặc định.
 *
 * <p>Nhân viên không tự đổi được mật khẩu (SRS UC-AU-04 chỉ dành cho Khách hàng,
 * dự án mở thêm cho Quản trị viên), nên quên mật khẩu thì cần đường này.
 */
export async function resetPassword(id: number): Promise<void> {
    await apiClient.post(`/admin/user/${id}/reset-password`)
}
