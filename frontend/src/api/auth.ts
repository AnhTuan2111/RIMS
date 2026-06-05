import { apiClient } from './client'
import type { LoginRequest, LoginResponse, LogoutResponse } from '../types/auth'

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', request)
    return data
}

export async function logout(): Promise<LogoutResponse> {
    const { data } = await apiClient.post<LogoutResponse>('/auth/logout')
    return data
}
