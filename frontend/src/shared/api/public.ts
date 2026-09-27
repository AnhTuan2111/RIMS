import {apiClient} from './client'

export interface PublicBestSellingDish {
    rank: number
    dishName: string
    imageUrl: string
}

export async function getPublicBestSellingDishes(
    signal?: AbortSignal,
): Promise<PublicBestSellingDish[]> {
    const response = await apiClient.get<PublicBestSellingDish[]>(
        '/public/menu/best-selling',
        {
            signal,
        },
    )

    return response.data
}

export interface PublicMenuDish {
    dishId: number
    name: string
    description: string | null
    price: number
    imageUrl: string | null
}

export interface PublicMenuSection {
    categoryId: number
    categoryName: string
    description: string | null
    dishes: PublicMenuDish[]
}

/**
 * Cả thực đơn công khai, đã gom sẵn theo danh mục ở backend.
 *
 * <p>Backend đã lọc: danh mục đang bật, món không ẩn, món đang bán, và bỏ hẳn
 * danh mục rỗng. Trang chủ KHÔNG lọc lại — lọc hai lần ở hai nơi là cách chắc
 * chắn nhất để hai nơi lệch nhau.
 */
export async function getPublicMenu(signal?: AbortSignal): Promise<PublicMenuSection[]> {
    const response = await apiClient.get<PublicMenuSection[]>('/public/menu', {signal})

    return response.data
}
