
import { apiClient } from './client'

export type OrderItemStatus =
    | 'PREPARING'
    | 'COMPLETED'
    | 'CANCEL_REQUESTED'

export type KitchenOrderItemResponse = {
    orderItemId: number
    orderId: number
    tableNumber: string
    dishName: string
    quantity: number
    status: OrderItemStatus
    createdAt?: string
}

export type DishDetailResponse = {
    orderItemId: number
    tableNumber: string
    dishName: string
    description?: string
    quantity: number
    note?: string
    status: OrderItemStatus
    createdAt?: string
}

export type DishListResponse = {
    dishId: number
    dishName: string
    category: string
    price: number
    available: boolean
}

export type ChefDashboardResponse = {
    preparingCount: number
    completedCount: number
    unavailableDishCount: number
}

/**
 * Lấy danh sách món đang chuẩn bị.
 * GET /rims/chef/orders
 */
export async function getKitchenOrders(): Promise<
    KitchenOrderItemResponse[]
> {
    const response =
        await apiClient.get<KitchenOrderItemResponse[]>(
            '/chef/orders',
        )

    return response.data
}

/**
 * Xem chi tiết một món trong hàng đợi bếp.
 * GET /rims/chef/orders/{orderItemId}
 */
export async function getDishDetail(
    orderItemId: number,
): Promise<DishDetailResponse> {
    const response =
        await apiClient.get<DishDetailResponse>(
            `/chef/orders/${orderItemId}`,
        )

    return response.data
}

/**
 * Cập nhật trạng thái món.
 * PUT /rims/chef/orders/{orderItemId}/status
 */
export async function updateOrderItemStatus(
    orderItemId: number,
    status: OrderItemStatus,
): Promise<string> {
    const response = await apiClient.put<string>(
        `/chef/orders/${orderItemId}/status`,
{
    status,
},
)

return response.data
}

/**
 * Lấy danh sách món ăn.
 * GET /rims/chef/dishes
 */
export async function getChefDishes(): Promise<
    DishListResponse[]
> {
    const response =
        await apiClient.get<DishListResponse[]>(
            '/chef/dishes',
        )

    return response.data
}

/**
 * Bật hoặc tắt trạng thái bán của món.
 * PUT /rims/chef/dishes/{dishId}/status
 */
export async function updateMenuStatus(
    dishId: number,
    available: boolean,
): Promise<string> {
    const response = await apiClient.put<string>(
        `/chef/dishes/${dishId}/status`,
        {
            available,
        },
    )

    return response.data
}

/**
 * Lấy số liệu Chef Dashboard.
 * GET /rims/chef/dashboard
 */
export async function getChefDashboard(): Promise<
    ChefDashboardResponse
> {
    const response =
        await apiClient.get<ChefDashboardResponse>(
            '/chef/dashboard',
        )

    return response.data
}

/**
 * Gửi yêu cầu hủy món.
 * POST /rims/chef/orders/{orderItemId}/cancel-request
 */
export async function requestCancelDish(
    orderItemId: number,
    reason: string,
): Promise<string> {
    const response = await apiClient.post<string>(
        `/chef/orders/${orderItemId}/cancel-request`,
        {
            reason,
        },
    )

    return response.data
}
export async function getCompletedOrders(): Promise<
    KitchenOrderItemResponse[]
> {
    const response =
        await apiClient.get<KitchenOrderItemResponse[]>(
            '/chef/orders/completed',
        )

    return response.data
}
