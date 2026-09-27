import {formatCurrency, formatCurrencyShort} from '@/shared/utils/format'

/**
 * Giữ lại tên cũ để các màn của Phục vụ không phải sửa, nhưng ruột nay dùng
 * bản định dạng tiền dùng chung — trước đây màn này ra "1.000 ₫" còn màn Thu
 * ngân ra "1,000 đ" cho cùng một con số.
 */
export function fmtPrice(p: number | null | undefined) {
    return formatCurrency(p ?? 0)
}

/**
 * Giá trên THẺ MÓN — chỗ hẹp, nên rút gọn.
 *
 * <p>Luật tiền đã chốt: thẻ món, thẻ bàn, chip, phiếu bếp và ô thống kê dùng
 * `189K`; bảng, hoá đơn và tổng tiền dùng `189.000 ₫`. Thẻ trong lưới thực đơn
 * chỉ rộng chừng 15rem, và ở đó con số phải đọc được từ xa hơn là chính xác
 * tới từng đồng.
 */
export function fmtPriceShort(p: number | null | undefined) {
    return formatCurrencyShort(p ?? 0)
}
