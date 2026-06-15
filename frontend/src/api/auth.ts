import { apiClient } from './client'
import type { LoginRequest, LoginResponse } from '../types/auth'
import { clearTokens, setTokens } from '../utils/tokenStorage'

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', request)

    setTokens(response.data.accessToken, response.data.refreshToken)

    localStorage.setItem('currentUser', JSON.stringify({
        userId: response.data.userId,
        username: response.data.username,
        fullName: response.data.fullName,
        phone: response.data.phone,
        email: response.data.email,
        role: response.data.role,
    }))

    return response.data
}

export function logout() {
    clearTokens()
    localStorage.removeItem('currentUser')
}