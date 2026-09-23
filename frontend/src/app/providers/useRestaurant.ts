import {createContext, useContext} from 'react'

import type {RestaurantProfile} from '@/shared/api/restaurant'

export interface RestaurantContextValue {
    profile: RestaurantProfile | null
    isLoading: boolean
    /** Gọi sau khi quản trị viên lưu cấu hình, để mọi màn cập nhật ngay. */
    refresh: () => Promise<void>
}

export const RestaurantContext = createContext<RestaurantContextValue>({
    profile: null,
    isLoading: true,
    refresh: async () => {},
})

/**
 * Thông tin nhận diện nhà hàng.
 *
 * <p>Tách khỏi file provider để fast-refresh của Vite vẫn hoạt động — một file
 * chỉ nên export component hoặc chỉ export hằng/hàm, không trộn cả hai.
 */
export function useRestaurant() {
    return useContext(RestaurantContext)
}
