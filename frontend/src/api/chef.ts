import { apiClient } from './client'

export type OrderItemStatus = 'PREPARING' | 'COMPLETED'

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

export async function getKitchenOrders(): Promise<KitchenOrderItemResponse[]> {
    const response = await apiClient.get<KitchenOrderItemResponse[]>('/chef/orders')
    return response.data
}

export async function getDishDetail(orderItemId: number): Promise<DishDetailResponse> {
    const response = await apiClient.get<DishDetailResponse>(`/chef/orders/${orderItemId}`)
    return response.data
}

export async function updateOrderItemStatus(
    orderItemId: number,
    status: OrderItemStatus,
): Promise<string> {
    const response = await apiClient.put<string>(`/chef/orders/${orderItemId}/status`, {
        status,
    })

    return response.data
}

export async function getChefDishes(): Promise<DishListResponse[]> {
    const response = await apiClient.get<DishListResponse[]>('/chef/dishes')
    return response.data
}

export async function updateMenuStatus(
    dishId: number,
    available: boolean,
): Promise<string> {
    const response = await apiClient.put<string>(`/chef/dishes/${dishId}/status`, {
        available,
    })

    return response.data
}