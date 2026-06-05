export const RoleType = {
    ADMIN: 'ADMIN',
    CHEF: 'CHEF',
    WAITER: 'WAITER',
    CASHIER: 'CASHIER',
} as const

export type RoleType = (typeof RoleType)[keyof typeof RoleType]

export interface LoginRequest {
    username: string
    rawPassword: string
}

export interface LoginResponse {
    userId: number
    fullName: string
    phone: string
    email: string | null
    role: RoleType
}

export interface LogoutResponse {
    message: string
}
