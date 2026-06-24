import { apiClient } from './client'
import type { InvoiceHistoryResponse } from '../types/report'

export const adminApi = {
    getInvoiceHistory: () =>
        apiClient.get<InvoiceHistoryResponse[]>('/admin/invoice/history'),
}
