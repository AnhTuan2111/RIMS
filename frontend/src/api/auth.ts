import { apiClient } from './client'
import type {
    AuthUser,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RefreshTokenRequest,
    UserProfile,
} from '../types/auth'
import { clearTokens, setTokens } from '../utils/tokenStorage'

export async function login(request: LoginRequest): Promise<AuthUser> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', request)
    setTokens(data.accessToken, data.refreshToken)
    return toAuthUser(data)
}

export async function refresh(refreshToken: string): Promise<AuthUser> {
    const body: RefreshTokenRequest = { refreshToken }
    const { data } = await apiClient.post<LoginResponse>('/auth/refresh', body)
    setTokens(data.accessToken, data.refreshToken)
    return toAuthUser(data)
}

export async function getCurrentUser(): Promise<AuthUser> {
    const { data } = await apiClient.get<UserProfile>('/auth/me')
    return {
        userId: data.userId,
        username: data.username,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        role: data.role,
    }
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post<LogoutResponse>('/auth/logout')
    } finally {
        clearTokens()
    }
}

function toAuthUser(response: LoginResponse): AuthUser {
    return {
        userId: response.userId,
        username: response.username,
        fullName: response.fullName,
        phone: response.phone,
        email: response.email,
        role: response.role,
    }
}
