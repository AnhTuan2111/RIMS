/*
 * Nơi duy nhất định dạng số, tiền và ngày.
 *
 * Trước đây hơn 10 màn mỗi màn tự viết một bản formatCurrency / formatDateTime
 * riêng, nên cùng một số tiền hiện ra mỗi chỗ một kiểu.
 */

/**
 * Tiền ĐẦY ĐỦ — dùng ở bảng, hoá đơn, tổng tiền, màn thanh toán.
 *
 * <p>Ký hiệu là `₫` (U+20AB), không phải chữ `đ`. Chữ `đ` là một chữ cái; đặt
 * nó sau con số thì đọc ra như một đơn vị viết tắt tự chế.
 *
 * <p>150000 → "150.000 ₫"
 */
export function formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} ₫`
}

/**
 * Tiền RÚT GỌN — dùng ở thẻ bàn, thẻ món, chip, băng ảnh, ô thống kê, phiếu bếp.
 *
 * <p>Những chỗ đó hẹp, và ở đó con số phải đọc được từ xa hơn là chính xác tới
 * từng đồng. `485K` đọc được trong một liếc mắt; `485.000 ₫` thì không, và nó
 * còn đẩy thẻ rộng ra.
 *
 * <p>Ngưỡng rút gọn là 1.000: dưới mức đó ghi thẳng, vì "0,5K" vô nghĩa.
 *
 * <p>485000 → "485K" · 18400000 → "18,4tr" · 500 → "500 ₫"
 */
export function formatCurrencyShort(value: number): string {
    const amount = value ?? 0

    if (amount >= 1_000_000) {
        const millions = amount / 1_000_000
        // Một chữ số thập phân là đủ để phân biệt 18,4tr với 18,5tr. Hai chữ
        // số thì con số dài bằng bản đầy đủ, tức là mất hết lý do rút gọn.
        const text = millions.toFixed(1).replace(/\.0$/, '').replace('.', ',')
        return `${text}tr`
    }

    if (amount >= 1_000) {
        const thousands = amount / 1_000
        const text = thousands.toFixed(1).replace(/\.0$/, '').replace('.', ',')
        return `${text}K`
    }

    return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`
}

/** 150000 → "150.000" */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

/** "2026-01-15T14:30:00" → "15/01/2026 14:30" */
export function formatDateTime(value: string): string {
    const d = new Date(value)
    const date = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    const time = d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
    return `${date} ${time}`
}

/** Dạng ngày gửi lên API: "2026-01-15" */
export function formatDateForApi(date: Date): string {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

/**
 * Thứ Hai của tuần chứa ngày đã cho.
 *
 * <p>getDay() trả 0 cho Chủ nhật, nên Chủ nhật phải lùi 6 ngày chứ không phải
 * tiến 1 — nếu không, Chủ nhật sẽ bị xếp nhầm sang tuần kế tiếp.
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

/** Chủ nhật của tuần chứa ngày đã cho, tính tới 23:59:59.999. */
export function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
}
