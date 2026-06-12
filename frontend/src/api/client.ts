import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '../types/auth'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage'

export const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken()
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
    const storedRefreshToken = getRefreshToken()
    if (!storedRefreshToken) {
        throw new Error('Missing refresh token')
    }

    const { data } = await axios.post<LoginResponse>('/api/auth/refresh', {
        refreshToken: storedRefreshToken,
    })

    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            if (!getRefreshToken()) {
                clearTokens()
                return Promise.reject(error)
            }

            originalRequest._retry = true

            try {
                refreshPromise ??= refreshAccessToken()
                const newAccessToken = await refreshPromise
                refreshPromise = null

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                refreshPromise = null
                clearTokens()
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)
