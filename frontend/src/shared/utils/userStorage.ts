/**
 * shared/utils/userStorage.ts
 * Single source of truth for reading/writing the currentUser to localStorage.
 * Replaces 4+ duplicate JSON.parse(localStorage.getItem('currentUser')) calls
 * across Sidebar, ProfilePage, and auth API layer.
 */

import type {AuthUser} from '@/shared/types/auth'

const CURRENT_USER_KEY = 'currentUser'

/**
 * Returns the currently logged-in user from localStorage, or null if not found
 * or if the stored value is malformed.
 */
export function getCurrentUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(CURRENT_USER_KEY)
        if (!raw) return null
        return JSON.parse(raw) as AuthUser
    } catch {
        return null
    }
}

/**
 * Persists a user object to localStorage as currentUser.
 */
export function setCurrentUser(user: AuthUser): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

/**
 * Removes the currentUser entry from localStorage (used on logout).
 */
export function clearCurrentUser(): void {
    localStorage.removeItem(CURRENT_USER_KEY)
}

/**
 * Returns the userId of the currently stored user, or null.
 * Convenience shorthand that avoids a full object parse when only the ID
 * is needed.
 */
export function getCurrentUserId(): number | null {
    const user = getCurrentUser()
    return user?.userId ?? user?.id ?? null
}
