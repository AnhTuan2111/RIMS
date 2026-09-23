import {apiClient} from './client'

export interface RestaurantProfile {
    name: string
    tagline?: string | null
    description?: string | null
    logoUrl?: string | null
    heroImageUrl?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    /** Giờ mở cửa do chủ quán tự điền, dạng chữ tự do. */
    openingHours?: string | null
    /**
     * Khung giờ hệ thống thực sự nhận đặt bàn, ví dụ "08:00 - 20:00".
     *
     * <p>Backend sinh ra, không sửa được từ màn Cấu hình — nó là quy tắc nghiệp vụ
     * chứ không phải thông tin hiển thị.
     */
    reservationHours?: string | null
}

export type UpdateRestaurantProfileRequest = RestaurantProfile

/** Đọc công khai — trang chủ và trang đăng nhập gọi trước khi có tài khoản. */
export async function getPublicProfile(signal?: AbortSignal): Promise<RestaurantProfile> {
    const res = await apiClient.get<RestaurantProfile>('/public/restaurant', {signal})
    return res.data
}

/** Đọc ở màn quản trị. */
export async function getProfile(signal?: AbortSignal): Promise<RestaurantProfile> {
    const res = await apiClient.get<RestaurantProfile>('/admin/restaurant', {signal})
    return res.data
}

export async function updateProfile(
    data: UpdateRestaurantProfileRequest,
): Promise<RestaurantProfile> {
    const res = await apiClient.put<RestaurantProfile>('/admin/restaurant', data)
    return res.data
}
