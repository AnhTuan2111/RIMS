/**
 * shared/api/admin/index.ts
 * Re-exports all admin API modules for backward compatibility.
 */

import {apiClient} from '../client'
import {invoicesApi} from './invoices'
import {revenueApi} from './revenue'
import type {TableDetailResponse} from '@/shared/types/table'

export * from './accounts'
export * from './invoices'
export * from './revenue'
export * from './menu'

// Combine into the legacy adminApi object
export const adminApi = {
    ...invoicesApi,
    ...revenueApi,
}