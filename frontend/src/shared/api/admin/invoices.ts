/**
 * shared/api/admin/invoices.ts
 * Payment history and invoice detail endpoints.
 * Split from the original 637-line admin/index.ts god file.
 */

import {apiClient} from '../client'
import type {
    AdminPaymentDetail,
    AdminPaymentDetailItem,
    AdminPaymentHistoryItem,
    AdminPaymentHistoryPage,
    AdminPaymentMethod,
} from '@/shared/types/admin'

// Re-export types so callers can import from this file alone
export type {
    AdminPaymentDetail,
    AdminPaymentDetailItem,
    AdminPaymentHistoryItem,
    AdminPaymentHistoryPage,
    AdminPaymentMethod,
}

export const invoicesApi = {
    /** Returns paginated payment history */
    getPaymentHistory: (
        page = 1,
        pageSize = 10,
        signal?: AbortSignal,
    ) =>
        apiClient.get<AdminPaymentHistoryPage>('/admin/invoice/history', {
            params: {page, pageSize},
            signal,
        }),

    /** Returns detail for a single invoice */
    getPaymentDetail: (
        invoiceId: number,
        signal?: AbortSignal,
    ) =>
        apiClient.get<AdminPaymentDetail>(`/admin/invoice/${invoiceId}`, {
            signal,
        }),
}
