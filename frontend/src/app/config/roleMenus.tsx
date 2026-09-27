import type {IconName} from '@/shared/components/ui/Icon'
import {RoleType} from '@/shared/types/auth'

/** Một màn trong băng mục con. */
export type MenuItem = {
    label: string
    path: string
}

/**
 * Một ô trên rail.
 *
 * <p>Có `items` thì ô đó là một NHÓM: bấm vào đi tới màn đầu tiên, và băng mục
 * con hiện ra dưới hàng breadcrumb. Không có `items` thì nó là một màn.
 */
export type MenuEntry = {
    label: string
    path: string
    icon: IconName
    items?: MenuItem[]
}

export const ROLE_LABELS: Record<string, string> = {
    [RoleType.ADMIN]: 'Quản trị viên',
    [RoleType.CHEF]: 'Đầu bếp',
    [RoleType.WAITER]: 'Phục vụ',
    [RoleType.CASHIER]: 'Thu ngân',
    [RoleType.CUSTOMER]: 'Khách hàng',
}

/**
 * Điều hướng theo vai trò.
 *
 * <p>Quản trị có MƯỜI MỘT màn. Xếp mười ô dọc trong một rail 4,6rem thì rail phải
 * cuộn, và rail cuộn là thứ tệ nhất trong điều hướng: người ta không biết còn
 * gì phía dưới. Nên mười màn gộp thành BỐN NHÓM, mục con nằm ở băng ngang.
 *
 * <p>Bốn vai còn lại chỉ có ba tới sáu màn nên để phẳng — không nhóm, không
 * băng. Hình dạng rail vẫn y nhau ở cả năm vai, nên vẫn là MỘT HỆ.
 */
export const roleMenus: Record<string, MenuEntry[]> = {
    [RoleType.ADMIN]: [
        {
            label: 'Bán hàng',
            path: '/admin/dashboard',
            icon: 'chart',
            items: [
                {label: 'Tổng quan', path: '/admin/dashboard'},
                {label: 'Thống kê', path: '/admin/statistics'},
                {label: 'Hoá đơn', path: '/admin/invoices'},
            ],
        },
        {
            label: 'Thực đơn',
            path: '/admin/menu',
            icon: 'kitchen',
            items: [
                {label: 'Menu', path: '/admin/menu'},
                {label: 'Danh mục', path: '/admin/categories'},
                {label: 'Món ăn', path: '/admin/dishes'},
            ],
        },
        {
            label: 'Tài khoản',
            path: '/admin/users',
            icon: 'user',
            items: [
                {label: 'Nhân sự', path: '/admin/users'},
                {label: 'Hồ sơ của tôi', path: '/profile'},
            ],
        },
        {
            label: 'Cấu hình',
            path: '/admin/tables',
            icon: 'gear',
            items: [
                {label: 'Bàn', path: '/admin/tables'},
                {label: 'Mặt bằng', path: '/admin/floor'},
                {label: 'Nhà hàng', path: '/admin/restaurant'},
            ],
        },
    ],

    [RoleType.CHEF]: [
        {label: 'Tổng quan', path: '/chef/dashboard', icon: 'chart'},
        {label: 'Cần chế biến', path: '/chef/orders', icon: 'ticket'},
        {label: 'Gom món', path: '/chef/grouped-orders', icon: 'rows'},
        {label: 'Món ăn', path: '/chef/dishes', icon: 'kitchen'},
        {label: 'Đã xong', path: '/chef/completed-orders', icon: 'check'},
        {label: 'Đã huỷ', path: '/chef/cancelled-orders', icon: 'ban'},
        {label: 'Hồ sơ', path: '/profile', icon: 'user'},
    ],

    [RoleType.WAITER]: [
        {label: 'Bàn', path: '/waiter/tables', icon: 'table'},
        {label: 'Đặt bàn', path: '/waiter/reservations', icon: 'booking'},
        {label: 'Hồ sơ', path: '/profile', icon: 'user'},
    ],

    [RoleType.CASHIER]: [
        {label: 'Thanh toán', path: '/cashier/payments', icon: 'invoice'},
        {label: 'Hoá đơn', path: '/cashier/invoices', icon: 'ticket'},
        {label: 'Hồ sơ', path: '/profile', icon: 'user'},
    ],

    [RoleType.CUSTOMER]: [
        {label: 'Đặt bàn', path: '/customer/reservations', icon: 'booking'},
        {label: 'Hồ sơ', path: '/profile', icon: 'user'},
    ],
}

/**
 * Ô rail và màn con khớp với đường dẫn hiện tại.
 *
 * <p>Dùng cho cả ba chỗ: tô ô rail đang mở, dựng băng mục con, và ghép
 * breadcrumb. Ba chỗ đọc chung một nguồn nên không bao giờ lệch nhau.
 */
export function matchMenu(role: string, pathname: string) {
    const entries = roleMenus[role] ?? []

    for (const entry of entries) {
        if (entry.items) {
            const item = entry.items.find((i) => pathname.startsWith(i.path))
            if (item) {
                return {entry, item}
            }
        } else if (pathname.startsWith(entry.path)) {
            return {entry, item: null}
        }
    }

    return {entry: null, item: null}
}
