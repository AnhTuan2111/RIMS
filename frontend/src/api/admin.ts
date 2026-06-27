import { apiClient } from './client'

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

}
