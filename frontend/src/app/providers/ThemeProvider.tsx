import {useCallback, useEffect, useState} from 'react'
import type {ReactNode} from 'react'

import {
    applyPreference,
    readStoredPreference,
    THEME_STORAGE_KEY,
    ThemeContext,
    type ThemePreference,
} from '@/app/providers/useTheme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemIsDark() {
    return window.matchMedia(DARK_QUERY).matches
}

/**
 * Chế độ sáng/tối.
 *
 * <p>Bảng token đã dựng sẵn cả hai chủ đề từ đầu nhưng chưa có chỗ nào đặt
 * thuộc tính data-theme, nên chủ đề tối chưa từng hiển thị được.
 *
 * <p>Nhà hàng chạy ca tối và bếp thường để màn hình trong khu vực thiếu sáng,
 * nên đây không phải tuỳ chọn trang trí.
 */
export function ThemeProvider({children}: {children: ReactNode}) {
    const [preference, setPreferenceState] = useState<ThemePreference>(() =>
        readStoredPreference(),
    )

    const [systemDark, setSystemDark] = useState<boolean>(() => systemIsDark())

    // Áp ngay khi đổi, không đợi vòng render sau.
    useEffect(() => {
        applyPreference(preference)
    }, [preference])

    // Ở chế độ auto, theo dõi cài đặt hệ điều hành đổi giữa chừng.
    useEffect(() => {
        const media = window.matchMedia(DARK_QUERY)

        function handleChange(event: MediaQueryListEvent) {
            setSystemDark(event.matches)
        }

        media.addEventListener('change', handleChange)

        return () => media.removeEventListener('change', handleChange)
    }, [])

    // Đổi chủ đề ở tab khác thì tab này cũng đổi theo.
    useEffect(() => {
        function handleStorage(event: StorageEvent) {
            if (event.key !== THEME_STORAGE_KEY) {
                return
            }

            setPreferenceState(readStoredPreference())
        }

        window.addEventListener('storage', handleStorage)

        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next)

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, next)
        } catch {
            // Không lưu được thì lựa chọn chỉ sống trong phiên này. Vẫn hơn là
            // để cả trang hỏng vì một chỗ lưu trữ bị chặn.
        }
    }, [])

    const resolved: 'light' | 'dark' =
        preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference

    return (
        <ThemeContext.Provider value={{preference, resolved, setPreference}}>
            {children}
        </ThemeContext.Provider>
    )
}
