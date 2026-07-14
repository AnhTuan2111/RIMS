export const RoleType = {
    ADMIN: 'ADMIN',
    CHEF: 'CHEF',
    WAITER: 'WAITER',
    CASHIER: 'CASHIER',
    CUSTOMER: 'CUSTOMER',
} as const

export type RoleType = (typeof RoleType)[keyof typeof RoleType]

export interface LoginRequest {
    username: string
    rawPassword: string
}

export interface LoginResponse {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    authenticated: boolean
    userId: number
    username: string
    fullName: string
    phone: string
    email: string | null
    role: RoleType
}

export interface RefreshTokenRequest {
    refreshToken: string
}

export interface UserProfile {
    userId: number
    username: string
    fullName: string
    phone: string
    email: string | null
    role: RoleType
}

export interface LogoutResponse {
    message: string
}

export interface AuthUser {
    userId: number
    username: string
    fullName: string
    phone: string
    email: string | null
    role: RoleType
}

export interface UserResponse {
    id: number
    username: string
    fullName: string
    email: string | null
    phone: string
    role: RoleType
    isActive: boolean
    createdAt: string
    rewardPoints?: number
}