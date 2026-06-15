import { RoleType } from '../types/auth'

export type RoleMenuItem = {
    label: string
    path: string
}

export const ROLE_LABELS: Record<string, string> = {
    [RoleType.ADMIN]: 'Quản trị viên',
    [RoleType.CHEF]: 'Đầu bếp',
    [RoleType.WAITER]: 'Phục vụ',
    [RoleType.CASHIER]: 'Thu ngân',
}

export const roleMenus: Record<string, RoleMenuItem[]> = {
    [RoleType.ADMIN]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Quản lý nhân viên', path: '/admin/users' },
        { label: 'Quản lý bàn', path: '/admin/tables' },
        { label: 'Quản lý món ăn', path: '/admin/dishes' },
    ],

    [RoleType.CHEF]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Đơn cần chế biến', path: '/chef/orders' },
        { label: 'Danh sách món ăn', path: '/chef/dishes' },
    ],

    [RoleType.WAITER]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Danh sách bàn', path: '/waiter/tables' },
        { label: 'Tạo order', path: '/waiter/orders/new' },
        { label: 'Order đang phục vụ', path: '/waiter/orders' },
    ],

    [RoleType.CASHIER]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Thanh toán', path: '/cashier/payments' },
        { label: 'Hóa đơn', path: '/cashier/invoices' },
    ],
}