/**
 * shared/api/admin/tables.ts
 * Quản lý bàn: thêm, sửa, cất đi hoặc xoá hẳn.
 */

import {apiClient} from '../client'

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'SERVING'

export interface AdminTable {
    id: number
    tableNumber: string
    capacity: number
    /** Tình trạng lúc này, do các luồng vận hành đổi — không phải quyết định của quản lý. */
    status: TableStatus
    /** Còn nằm trong sơ đồ bàn hay đã cất đi. */
    active: boolean
    orderCount: number
    reservationCount: number
    /** Chưa từng dùng thì mới xoá hẳn được; đã dùng rồi thì chỉ cất đi. */
    deletable: boolean
}

export interface TableFormData {
    tableNumber: string
    capacity: number
}

export interface TableRemovalResponse {
    /** true: đã xoá khỏi cơ sở dữ liệu. false: chỉ cất khỏi sơ đồ. */
    deleted: boolean
    message: string
}

/** Cả bàn đang dùng lẫn bàn đã cất — màn quản lý phải bật lại được. */
export const getAllTables = (signal?: AbortSignal) =>
    apiClient.get<AdminTable[]>('/admin/table/all', {signal})

export const createTable = (data: TableFormData) =>
    apiClient.post<AdminTable>('/admin/table/new', data)

export const updateTable = (id: number, data: TableFormData & {active: boolean}) =>
    apiClient.put<AdminTable>(`/admin/table/${id}`, data)

/**
 * Xoá bàn chưa dùng bao giờ, hoặc cất đi bàn đã có lịch sử.
 *
 * Đơn cũ còn trỏ về bàn trong hoá đơn và báo cáo doanh thu, nên bàn đã dùng
 * thì chỉ được cất. Kết quả nói rõ việc nào đã xảy ra.
 */
export const deleteTable = (id: number) =>
    apiClient.delete<TableRemovalResponse>(`/admin/table/${id}`)
