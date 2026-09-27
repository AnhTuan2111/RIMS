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
/*
 * VAI TRÒ KHÔNG CÓ MÀU RIÊNG.
 *
 * Bản cũ có ROLE_TAG_CLASS gán cho mỗi vai một màu: Quản trị đỏ, Bếp hổ phách,
 * Phục vụ lục, Thu ngân vàng. Năm màu đó mượn nguyên bảng màu ngữ nghĩa của hệ
 * — thứ chỉ có BỐN nghĩa: LÀM lục, BỎ đỏ, CHỜ hổ phách, TIN xanh.
 *
 * Hậu quả đọc thấy ngay trong bảng Nhân sự: nhãn "Phục vụ" lục nằm ngay cạnh
 * chip "Hoạt động" lục, và hai thứ hoàn toàn khác nhau lại trông như một. Tệ
 * hơn, "Quản trị viên" tô đỏ đọc ra là tài khoản có vấn đề.
 *
 * Vai trò là một cái TÊN, không phải một trạng thái. Tên thì đọc bằng chữ.
 */

export const STAFF_ROLES = [RoleType.CHEF, RoleType.WAITER, RoleType.CASHIER]

export type Tab = 'staff' | 'customer'

export type ModalType = 'create-staff' | 'create-customer' | 'edit' | 'detail' | null
