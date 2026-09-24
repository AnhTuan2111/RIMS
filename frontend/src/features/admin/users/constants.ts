import {RoleType} from '@/shared/types/auth'
export const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ',
    CASHIER: 'Thu ngân',
    CUSTOMER: 'Khách hàng',
}

/**
 * Màu huy hiệu vai trò.
 *
 * <p>Trước đây là năm mã màu Tailwind gõ thẳng (hổ phách, đỏ, lam, lục, tím) —
 * không thuộc bảng màu nào của dự án, và ở chế độ tối thì nền nhạt đó chói hẳn
 * lên giữa một màn tối.
 *
 * <p>Đây là nhãn nhận diện chứ không phải trạng thái, và chúng chỉ xuất hiện ở
 * màn Quản lý tài khoản — nơi không có trạng thái bàn hay món nào để lẫn với.
 * Mỗi huy hiệu luôn mang tên vai trò bằng chữ.
 */
export const ROLE_COLORS: Record<string, {bg: string; text: string}> = {
    ADMIN: {bg: 'var(--rims-brand-soft)', text: 'var(--rims-brand)'},
    CHEF: {bg: 'var(--rims-busy-soft)', text: 'var(--rims-busy)'},
    WAITER: {bg: 'var(--rims-ok-soft)', text: 'var(--rims-ok)'},
    CASHIER: {bg: 'var(--rims-gold-soft)', text: 'var(--rims-gold-deep)'},
    CUSTOMER: {bg: 'var(--rims-idle-soft)', text: 'var(--rims-idle)'},
}

export const STAFF_ROLES = [RoleType.CHEF, RoleType.WAITER, RoleType.CASHIER]

export type Tab = 'staff' | 'customer'

export type ModalType = 'create-staff' | 'create-customer' | 'edit' | 'detail' | null
