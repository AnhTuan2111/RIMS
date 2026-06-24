import { apiClient } from './client'
import type { LoginRequest, LoginResponse, UserProfile } from '../types/auth'
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

export async function getCurrentUser(): Promise<UserProfile> {
    const cached = localStorage.getItem('currentUser')
    if (cached) {
        return JSON.parse(cached) as UserProfile
    }
    const res = await apiClient.get<UserProfile>('/auth/me')
    return res.data
}

export function logout() {
    clearTokens()
    localStorage.removeItem('currentUser')
}

export async function forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email })
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { email, otp, newPassword })
}
