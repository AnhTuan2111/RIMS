// src/config/roleMenus.ts

import { RoleType } from '@/shared/types/auth'

export type RoleMenuItem = {
    label: string
    path: string
}

export const ROLE_LABELS: Record<string, string> = {
    [RoleType.ADMIN]: 'Quản trị viên',
    [RoleType.CHEF]: 'Đầu bếp',
    [RoleType.WAITER]: 'Phục vụ',
    [RoleType.CASHIER]: 'Thu ngân',
    [RoleType.CUSTOMER]: 'Khách hàng',
}

export const roleMenus: Record<string, RoleMenuItem[]> = {
    [RoleType.ADMIN]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Quản lý tài khoản', path: '/admin/users' },
        { label: 'Quản lý bàn', path: '/admin/tables' },
        { label: 'Quản lý menu', path: '/admin/menu' },
        { label: 'Quản lý danh mục', path: '/admin/categories' },
        { label: 'Quản lý món ăn', path: '/admin/dishes' },
        { label: 'Hồ sơ của tôi', path: '/profile' },
    ],

    [RoleType.CHEF]: [
        { label: 'Tổng quan', path: '/chef/dashboard' },
        { label: 'Đơn cần chế biến', path: '/chef/orders' },
        { label: 'Danh sách món ăn', path: '/chef/dishes' },
        { label: 'Món đã hủy', path: '/chef/cancelled-orders' },
        { label: 'Gom món để nấu', path: '/chef/grouped-orders' },
        { label: 'Hồ sơ của tôi', path: '/profile' },
    ],

    [RoleType.WAITER]: [
        { label: 'Danh sách bàn', path: '/waiter/tables' },
        { label: 'Đặt bàn', path: '/waiter/reservations' },
        { label: 'Hồ sơ của tôi', path: '/profile' },
    ],

    [RoleType.CASHIER]: [
        { label: 'Tổng quan', path: '/dashboard' },
        { label: 'Thanh toán', path: '/cashier/payments' },
        { label: 'Hóa đơn', path: '/cashier/invoices' },
        { label: 'Hồ sơ của tôi', path: '/profile' },
    ],

    [RoleType.CUSTOMER]: [
        { label: 'Đặt bàn', path: '/customer/reservations' },
        { label: 'Hồ sơ của tôi', path: '/profile' },
    ],
}