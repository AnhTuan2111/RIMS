import {useCallback, useEffect, useState} from 'react'
import type {ReactNode} from 'react'

import {RestaurantContext} from '@/app/providers/useRestaurant'
import {getPublicProfile, type RestaurantProfile} from '@/shared/api/restaurant'
import {isRequestCanceled} from '@/shared/utils/error'

/**
 * Cung cấp thông tin nhận diện nhà hàng cho toàn app.
 *
 * <p>Trước đây tên và mô tả nhà hàng viết cứng trong HomePage, LoginPage và
 * Sidebar, muốn dùng app cho quán khác là phải sửa code rồi build lại. Nay đọc
 * một lần từ API rồi chia cho mọi màn.
 */
export function RestaurantProvider({children}: {children: ReactNode}) {
    const [profile, setProfile] = useState<RestaurantProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const data = await getPublicProfile(signal)

            if (signal?.aborted) {
                return
            }

            setProfile(data)
        } catch (requestError: unknown) {
            if (signal?.aborted || isRequestCanceled(requestError)) {
                return
            }

            // Không chặn app nếu chưa đọc được: các màn tự dùng giá trị dự phòng.
            console.error('[RESTAURANT_PROFILE_FETCH_ERROR]', requestError)
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()

        // Loader chỉ đặt state SAU khi await xong; rule không đọc được điều đó.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- xem ghi chú trên
        void load(controller.signal)

        return () => controller.abort()
    }, [load])

    return (
        <RestaurantContext.Provider
            value={{
                profile,
                isLoading,
                refresh: async () => {
                    await load()
                },
            }}
        >
            {children}
        </RestaurantContext.Provider>
    )
}
