export type ActorRole = 'ADMIN' | 'CHEF' | 'WAITER' | 'CASHIER'

export type ActorMenuItem = {
    label: string
    path: string
}

export const ACTOR_LABELS: Record<ActorRole, string> = {
    ADMIN: 'Quản trị viên',
    CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ',
    CASHIER: 'Thu ngân',
}

export const actorMenus: Record<ActorRole, ActorMenuItem[]> = {
    ADMIN: [
        { label: 'Quản lý nhân viên', path: '/admin/users' },
        { label: 'Quản lý bàn', path: '/admin/tables' },
        { label: 'Quản lý món ăn', path: '/admin/dishes' },
    ],

    CHEF: [
        {
            label: 'Dashboard',
            path: '/chef/dashboard',
        },
        {
            label: 'Danh sách món đang chuẩn bị',
            path: '/chef/orders',
        },
        {
            label: 'Quản lý món ăn',
            path: '/chef/dishes',
        },
    ],

    WAITER: [
        { label: 'Danh sách bàn', path: '/waiter/tables' },
        { label: 'Tạo order', path: '/waiter/orders/new' },
        { label: 'Order đang phục vụ', path: '/waiter/orders' },
    ],

    CASHIER: [
        { label: 'Thanh toán', path: '/cashier/payments' },
        { label: 'Hóa đơn', path: '/cashier/invoices' },
    ],
}

export const actorDescriptions: Record<ActorRole, string> = {
    ADMIN: 'Quản lý nhân viên, bàn, món ăn và cấu hình hệ thống.',
    CHEF: 'Theo dõi đơn cần chế biến và quản lý trạng thái món ăn.',
    WAITER: 'Quản lý bàn, tạo order và theo dõi order đang phục vụ.',
    CASHIER: 'Xử lý thanh toán, hóa đơn và lịch sử giao dịch.',
}