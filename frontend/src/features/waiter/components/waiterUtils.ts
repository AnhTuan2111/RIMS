import {formatCurrency} from '@/shared/utils/format'

/**
 * Giữ lại tên cũ để các màn của Phục vụ không phải sửa, nhưng ruột nay dùng
 * bản định dạng tiền dùng chung — trước đây màn này ra "1.000 ₫" còn màn Thu
 * ngân ra "1,000 đ" cho cùng một con số.
 */
export function fmtPrice(p: number | null | undefined) {
    return formatCurrency(p ?? 0)
}
