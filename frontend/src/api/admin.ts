import {apiClient} from './client'
import type {UserResponse} from '../types/auth'
import type {TableDetailResponse} from './waiter'

export type AdminPaymentMethod = 'CASH' | 'QRCODE'
export type BestSellingPeriod = 'WEEK' | 'MONTH' | 'YEAR'
export type OrderShiftPeriod = 'WEEK' | 'YEAR'


export interface AdminPaymentHistoryItem {
    invoiceId: number
    orderId: number
    tableNumber: string
    paymentMethod: AdminPaymentMethod
    amount: number
    paymentDate: string
}

export interface AdminPaymentDetailItem {
    dishName: string
    quantity: number
    unitPrice: number
    amount: number
}

export interface AdminPaymentDetail {
    invoiceId: number
    orderId: number
    tableNumber: string
    paymentMethod: string
    finalAmount: number
    invoiceDate: string
    items: AdminPaymentDetailItem[]
}

export interface RevenueReportResponse {
    revenue: number
    period: string
}

export interface RevenueComparisonResponse {
    previousRevenue: number
    currentRevenue: number
    difference: number
    growthRate: number
    previousDays: number
    currentDays: number
    previousAverageRevenue: number
    currentAverageRevenue: number
}

export interface DailyRevenueItem {
    dayLabel: string
    date: string
    revenue: number
}

export interface WeeklyRevenueChartResponse {
    fromDate: string
    toDate: string
    items: DailyRevenueItem[]
}

export interface BestSellingDishItem {
    rank: number
    dishName: string
    totalQuantity: number
    totalRevenue: number
}

export interface BestSellingReportResponse {
    fromDate: string
    toDate: string
    dataRangeNote: string
    items: BestSellingDishItem[]
}

export interface HighestOrderShift {
    shiftName: string
    displayName: string
    startTime: string
    endTime: string
    orderCount: number
    percentage: number
}

export interface CreateCustomerRequest {
    username: string
    fullName: string
    email: string
    phone: string
    password: string
}

export interface CreateStaffRequest {
    username: string
    fullName: string
    email: string
    phone: string
    role: string
    password: string
}

export interface UpdateAccountRequest {
    username: string
    fullName: string
    email: string
    phone: string
    role?: string
}

// Dùng cho trang "Hồ sơ của tôi" (staff tự cập nhật thông tin của chính mình)
export interface UpdateOwnProfileRequest {
    fullName: string
    username: string
    email: string
    phone: string
}

export interface UserProfileResponse {
    userId: number
    username: string
    fullName: string
    phone: string
    email: string
    role: string
}

export interface SetAccountStatusRequest {
    active: boolean
}

export interface PageResponse<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

export interface GetAccountsParams {
    keyword?: string
    active?: boolean
    page?: number   // bắt đầu từ 0
    size?: number
}

// Staff accounts
export async function getStaffAccounts(params: GetAccountsParams = {}): Promise<PageResponse<UserResponse>> {
    const res = await apiClient.get<PageResponse<UserResponse>>('/admin/user/staff', {params})
    return res.data
}

// Customer accounts
export async function getCustomerAccounts(params: GetAccountsParams = {}): Promise<PageResponse<UserResponse>> {
    const res = await apiClient.get<PageResponse<UserResponse>>('/admin/user/customer', {params})
    return res.data
}

export async function getAccountDetail(id: number): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>(`/admin/user/${id}`)
    return res.data
}

export async function createCustomer(data: CreateCustomerRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/customer/new', data)
    return res.data
}

export async function createStaff(data: CreateStaffRequest): Promise<UserResponse> {
    const res = await apiClient.post<UserResponse>('/admin/user/staff/new', data)
    return res.data
}

export async function updateAccount(id: number, data: UpdateAccountRequest): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>(`/admin/user/${id}`, data)
    return res.data
}

// Legacy profile endpoints (dùng cho trang "Hồ sơ của tôi")
export async function getProfile(id: number): Promise<UserProfileResponse> {
    const res = await apiClient.get<UserProfileResponse>(`/admin/user/profile/${id}`)
    return res.data
}

export async function updateProfile(id: number, data: UpdateOwnProfileRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>(`/admin/user/profile/update/${id}`, data)
    return res.data
}

export type OrderShiftItem = HighestOrderShift

export interface OrderShiftReportResponse {
    startDate: string
    endDate: string
    totalPaidOrders: number
    averageOrdersPerDay: number
    highestOrderShift: HighestOrderShift
    shifts: OrderShiftItem[]
}

export const adminApi = {
    getPaymentHistory: () =>
        apiClient.get<AdminPaymentHistoryItem[]>(
            '/admin/invoice/history',
        ),

    getPaymentDetail: (invoiceId: number) =>
        apiClient.get<AdminPaymentDetail>(
            `/admin/invoice/${invoiceId}`,
        ),

    getTotalRevenue: () =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/total',
        ),

    getTodayRevenue: () =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/today',
        ),

    getWeeklyRevenue: () =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/weekly',
        ),

    getDailyRevenue: (
        fromDate: string,
        toDate: string,
    ) =>
        apiClient.get<WeeklyRevenueChartResponse>(
            '/admin/revenue/daily',
            {
                params: {
                    fromDate,
                    toDate,
                },
            },
        ),

    getMonthlyRevenue: () =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/monthly',
        ),

    getYearlyRevenue: () =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/yearly',
        ),

    getCustomRevenue: (
        fromDate: string,
        toDate: string,
    ) =>
        apiClient.get<RevenueReportResponse>(
            '/admin/revenue/custom',
            {
                params: {
                    fromDate,
                    toDate,
                },
            },
        ),

    compareRevenue: (
        previousStartDate: string,
        previousEndDate: string,
        currentStartDate: string,
        currentEndDate: string,
    ) =>
        apiClient.get<RevenueComparisonResponse>(
            '/admin/revenue/compare',
            {
                params: {
                    previousStartDate,
                    previousEndDate,
                    currentStartDate,
                    currentEndDate,
                },
            },
        ),

    getBestSellingReport: (
        period: BestSellingPeriod = 'WEEK',
    ) =>
        apiClient.get<BestSellingReportResponse>(
            '/admin/revenue/best-selling',
            {
                params: {
                    period,
                },
            },
        ),

    getBestSellingReportBetween: (
        fromDate: string,
        toDate: string,
    ) =>
        apiClient.get<BestSellingReportResponse>(
            '/admin/revenue/best-selling',
            {
                params: {
                    fromDate,
                    toDate,
                },
            },
        ),

    getOrderShiftReport: (
        period: OrderShiftPeriod = 'WEEK',
    ) =>
        apiClient.get<OrderShiftReportResponse>(
            '/admin/revenue/order-shifts',
            {
                params: {
                    period,
                },
            },
        ),

    getOrderShiftReportBetween: (
        fromDate: string,
        toDate: string,
    ) =>
        apiClient.get<OrderShiftReportResponse>(
            '/admin/revenue/order-shifts',
            {
                params: {
                    fromDate,
                    toDate,
                },
            },
        ),

    getTables: () =>
        apiClient.get<TableDetailResponse[]>('/admin/tables'),
}

export async function setAccountStatus(id: number, active: boolean): Promise<void> {
    await apiClient.patch(`/admin/user/${id}/status`, {active})
}

// ============================================
// CATEGORY TYPES
// ============================================
export interface CategoryResponse {
    id: number;
    name: string;
    description: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
    dishCount?: number;
}

export interface DishResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryFormData {
    name: string;
    description: string;
    isAvailable: boolean;
}

// ============================================
// CATEGORY API
// ============================================
export const categoryApi = {
    // Lấy tất cả danh mục
    getAllCategories: () =>
        apiClient.get<CategoryResponse[]>('/admin/category/all'),

    // Lấy tất cả món ăn
    getAllDishes: () =>
        apiClient.get<DishResponse[]>('/admin/dish/all'),

    // Tạo danh mục mới
    createCategory: (data: { name: string; description: string }) =>
        apiClient.post<CategoryResponse>('/admin/category/new', data),

    // Cập nhật danh mục
    updateCategory: (id: number, data: { name: string; description: string; isAvailable: boolean }) =>
        apiClient.put<CategoryResponse>(`/admin/category/${id}`, data),

    // Xóa danh mục (xóa mềm)
    deleteCategory: (id: number) =>
        apiClient.delete(`/admin/category/${id}`),
}
// Thêm interface DishFormData
export interface DishFormData {
    name: string;
    categoryId: string;
    price: number;
    description: string;
    imageUrl: string;
    isAvailable: boolean;
}

// Thêm dishApi
export const dishApi = {
    getAllDishes: () =>
        apiClient.get<DishResponse[]>('/admin/dish/all'),

    getAllCategories: () =>
        apiClient.get<CategoryResponse[]>('/admin/category/all'),

    createDish: (data: {
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        categoryId: number;
        isAvailable: boolean;
    }) =>
        apiClient.post<DishResponse>('/admin/dish/new', data),

    updateDish: (id: number, data: {
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        categoryId: number;
        isAvailable: boolean;
    }) =>
        apiClient.put<DishResponse>(`/admin/dish/update/${id}`, data),

    deleteDish: (id: number) =>
        apiClient.delete(`/admin/dish/delete/${id}`),
}
export const menuApi = {
    getMenuDashboard: () =>
        apiClient.get<MenuDashboardData>('/admin/menu'),
}
export interface DishSummary {
    id: number;
    name: string;
    categoryName: string;
    price: number;
    imageUrl: string;
    status: 'AVAILABLE' | 'PAUSED';
}

export interface CategoryStat {
    categoryName: string;
    status: 'ACTIVE' | 'HIDDEN';
    dishCount: number;
}

export interface MenuDashboardData {
    totalDishes: number;
    totalCategories: number;
    totalPausedDishes: number;
    totalHiddenDishes: number;
    latestDishes: DishSummary[];
    categoryStats: CategoryStat[];
    allPausedDishesList?: DishSummary[];
}