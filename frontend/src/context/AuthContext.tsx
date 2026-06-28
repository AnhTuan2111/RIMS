import {createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState,} from 'react'
import * as authApi from '../api/auth'
import type {AuthUser, LoginRequest} from '../types/auth'
import {clearTokens, hasAccessToken} from '../utils/tokenStorage'
import {getErrorMessage} from '../utils/error'

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    login: (request: LoginRequest) => Promise<void>
    logout: () => Promise<void>
    clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function restoreSession() {
            if (!hasAccessToken()) {
                setIsLoading(false)
                return
            }

            try {
                const currentUser = await authApi.getCurrentUser()
                setUser(currentUser)
            } catch {
                clearTokens()
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        void restoreSession()
    }, [])

    const login = useCallback(async (request: LoginRequest) => {
        setError(null)
        setIsLoading(true)
        try {
            const loggedInUser = await authApi.login(request)
            setUser(loggedInUser)
        } catch (err) {
            setError(getErrorMessage(err))
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            await authApi.logout()
        } finally {
            setUser(null)
            setIsLoading(false)
        }
    }, [])

    const clearError = useCallback(() => setError(null), [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            error,
            login,
            logout,
            clearError,
        }),
        [user, isLoading, error, login, logout, clearError],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* eslint-disable react-refresh/only-export-components */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
