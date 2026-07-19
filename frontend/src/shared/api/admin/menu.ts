/**
 * shared/api/admin/menu.ts
 * Category, dish, and menu dashboard endpoints.
 * Split from the original 637-line admin/index.ts god file.
 */

import {apiClient} from '../client'
import type {
    CategoryFormData,
    CategoryResponse,
    DishFormData,
    DishResponse,
    MenuDashboardData,
} from '@/shared/types/admin'

// Re-export types so callers can import from this file alone
export type {
    CategoryFormData,
    CategoryResponse,
    DishFormData,
    DishResponse,
    MenuDashboardData,
}

export const categoryApi = {
    /** Returns all categories */
    getAllCategories: (signal?: AbortSignal) =>
        apiClient.get<CategoryResponse[]>('/admin/category/all', {signal}),

    /** Returns all dishes */
    getAllDishes: (signal?: AbortSignal) =>
        apiClient.get<DishResponse[]>('/admin/dish/all', {signal}),

    /** Creates a new category */
    createCategory: (data: Pick<CategoryFormData, 'name' | 'description'>) =>
        apiClient.post<CategoryResponse>('/admin/category/new', data),

    /** Updates an existing category */
    updateCategory: (
        id: number,
        data: CategoryFormData,
    ) =>
        apiClient.put<CategoryResponse>(`/admin/category/${id}`, data),

    /** Soft-deletes a category */
    deleteCategory: (id: number) =>
        apiClient.delete(`/admin/category/${id}`),
}

export const dishApi = {
    /** Returns all dishes */
    getAllDishes: (signal?: AbortSignal) =>
        apiClient.get<DishResponse[]>('/admin/dish/all', {signal}),

    /** Returns all categories (used by dish forms) */
    getAllCategories: (signal?: AbortSignal) =>
        apiClient.get<CategoryResponse[]>('/admin/category/all', {signal}),

    /** Creates a new dish */
    createDish: (data: {
        name: string
        description: string
        price: number
        imageUrl: string
        categoryId: number
        isAvailable: boolean
    }) =>
        apiClient.post<DishResponse>('/admin/dish/new', data),

    /** Updates an existing dish */
    updateDish: (
        id: number,
        data: {
            name: string
            description: string
            price: number
            imageUrl: string
            categoryId: number
            isAvailable: boolean
        },
    ) =>
        apiClient.put<DishResponse>(`/admin/dish/update/${id}`, data),

    /** Deletes a dish */
    deleteDish: (id: number) =>
        apiClient.delete(`/admin/dish/delete/${id}`),
}

export const menuApi = {
    /** Returns the menu dashboard overview */
    getMenuDashboard: (signal?: AbortSignal) =>
        apiClient.get<MenuDashboardData>('/admin/menu', {signal}),
}
