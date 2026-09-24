/*
 * Nơi duy nhất định dạng số, tiền và ngày.
 *
 * Trước đây hơn 10 màn mỗi màn tự viết một bản formatCurrency / formatDateTime
 * riêng, nên cùng một số tiền hiện ra mỗi chỗ một kiểu.
 */

/** 150000 → "150.000 đ" */
export function formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} đ`
}

/** 150000 → "150.000" */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

/** Dạng rút gọn cho biểu đồ: 1500000 → "1,5M đ" */
export function formatCurrencyCompact(value: number): string {
    return (
        new Intl.NumberFormat('vi-VN', {
            notation: 'compact',
            compactDisplay: 'short',
        }).format(value ?? 0) + ' đ'
    )
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
