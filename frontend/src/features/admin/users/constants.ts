import {RoleType} from '@/shared/types/auth'

export const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ',
    CASHIER: 'Thu ngân',
    CUSTOMER: 'Khách hàng',
}

/**
 * Lớp huy hiệu vai trò.
 *
 * <p>Ban đầu là năm mã màu Tailwind gõ thẳng (hổ phách, đỏ, lam, lục, tím) —
 * không thuộc bảng màu nào của dự án, và ở chế độ tối thì nền nhạt đó chói
 * hẳn lên giữa một màn tối. Sau đó thành năm cặp biến var(--rims-*) tô vào
 * JSX bằng thuộc tính style. Nay là năm lớp trong kit: đổi diện mạo huy hiệu
 * là sửa một chỗ trong CSS, không phải trong component.
 *
 * <p>Đây là nhãn nhận diện chứ không phải trạng thái, và chúng chỉ xuất hiện
 * ở màn Quản lý tài khoản — nơi không có trạng thái bàn hay món nào để lẫn
 * với. Mỗi huy hiệu luôn mang tên vai trò bằng chữ.
 */
export const ROLE_TAG_CLASS: Record<string, string> = {
    ADMIN: 'rk-tag--brand',
    CHEF: 'rk-tag--busy',
    WAITER: 'rk-tag--ok',
    CASHIER: 'rk-tag--gold',
    CUSTOMER: 'rk-tag--idle',
}

export const STAFF_ROLES = [RoleType.CHEF, RoleType.WAITER, RoleType.CASHIER]

export type Tab = 'staff' | 'customer'

export type ModalType = 'create-staff' | 'create-customer' | 'edit' | 'detail' | null
