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

// Định nghĩa interface cho Register request
export interface RegisterRequest {
    username: string;
    fullName: string;
    email: string;
    phone: string;
}

// Định nghĩa interface cho Register response
export interface RegisterResponse {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

// Hàm register - SỬA: dùng apiClient và path đúng
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
    // Vì baseURL đã là '/rims', nên path chỉ cần '/auth/register'
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
}