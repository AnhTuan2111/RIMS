import {createContext, useContext} from 'react'

/**
 * `auto` đi theo cài đặt của hệ điều hành. Hai giá trị còn lại là người dùng
 * chủ động ghi đè.
 */
export type ThemePreference = 'auto' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'rims.theme'

export interface ThemeContextValue {
    preference: ThemePreference
    /** Chế độ đang thực sự hiển thị, đã giải quyết `auto`. */
    resolved: 'light' | 'dark'
    setPreference: (next: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
    preference: 'auto',
    resolved: 'light',
    setPreference: () => {},
})

export function useTheme() {
    return useContext(ThemeContext)
}

/**
 * Đọc lựa chọn đã lưu.
 *
 * <p>Ở chế độ riêng tư hoặc khi trình duyệt chặn lưu trữ, việc đọc có thể ném
 * lỗi — lúc đó cứ chạy theo cài đặt hệ điều hành.
 */
export function readStoredPreference(): ThemePreference {
    try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY)

        if (raw === 'light' || raw === 'dark' || raw === 'auto') {
            return raw
        }
    } catch {
        // không đọc được thì coi như chưa từng chọn
    }

    return 'auto'
}

/**
 * Ghi thuộc tính lên thẻ html.
 *
 * <p>`auto` thì gỡ hẳn thuộc tính, để khối @media trong tokens.css tự quyết.
 * Đây là giao kèo mà bảng token đã dựng sẵn từ đầu.
 */
export function applyPreference(preference: ThemePreference) {
    const root = document.documentElement

    if (preference === 'auto') {
        root.removeAttribute('data-theme')
        root.style.colorScheme = 'light dark'
        return
    }

    root.setAttribute('data-theme', preference)
    root.style.colorScheme = preference
}
