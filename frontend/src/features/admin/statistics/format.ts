import {formatCurrencyShort, formatNumber} from '@/shared/utils/format'

import {shiftCatalog} from './types'
import type {ShiftViewItem} from './types'
import type {OrderShiftReportResponse} from '@/shared/api/admin'
/*
 * Ba hàm định dạng dưới đây từng là bản CHÉP LẠI của shared/utils/format —
 * đúng thứ CONTRIBUTING cấm, và là lý do cùng một số tiền hiện ra ở màn Thống
 * kê bằng "0 đ" trong khi mọi màn khác đã là "0 ₫".
 *
 * Ô thống kê là "chỗ hẹp" theo luật tiền đã chốt, nên nó rút gọn: 68,4tr chứ
 * không phải 68.430.000 ₫.
 */
export function formatRevenueCurrency(value?: number | null) {
    return formatCurrencyShort(value ?? 0)
}

export function getDishInitial(dishName: string) {
    return dishName.trim().charAt(0).toUpperCase() || '?'
}

export function resolveDishImageSrc(imageUrl?: string | null) {
    const value = imageUrl?.trim()

    if (!value) {
        return null
    }

    if (
        value.startsWith('http') ||
        value.startsWith('//') ||
        value.startsWith('data:') ||
        value.startsWith('/')
    ) {
        return value
    }

    return `/image/${value}`
}

export {formatNumber}

export function formatDecimal(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    }).format(value ?? 0)
}

/** Dòng "Ngoài giờ ca" — không phải một ca, chỉ là phần chênh để tổng khớp. */
export const OUTSIDE_SHIFT = 'OUTSIDE'

export function buildShiftRows(report: OrderShiftReportResponse | null): ShiftViewItem[] {
    const rows: ShiftViewItem[] = shiftCatalog.map((shift) => {
        const apiShift = report?.shifts?.find(
            (item) => item.shiftName === shift.shiftName,
        )
        const fallbackShift =
            report?.highestOrderShift?.shiftName === shift.shiftName
                ? report.highestOrderShift
                : null

        return {
            ...shift,
            displayName: apiShift?.displayName ?? shift.displayName,
            startTime: apiShift?.startTime ?? shift.startTime,
            endTime: apiShift?.endTime ?? shift.endTime,
            orderCount: apiShift?.orderCount ?? fallbackShift?.orderCount ?? 0,
            percentage: apiShift?.percentage ?? fallbackShift?.percentage ?? 0,
        }
    })

    // Đơn thanh toán NGOÀI mọi khung ca (trước 08:00, sau 22:00) — quán đóng
    // cửa muộn là chuyện thường. Backend đếm chúng vào tổng nhưng không vào ca
    // nào, nên trước đây giữa vòng tròn ghi "23 đơn" mà bốn ca đều "0 đơn ·
    // 0%": hai con số cạnh nhau không cộng lại được. Nay phần chênh có dòng
    // riêng, và vòng tròn luôn khớp với con số ở giữa.
    const total = report?.totalPaidOrders ?? 0
    const inShifts = rows.reduce((sum, row) => sum + row.orderCount, 0)
    const outside = total - inShifts

    if (outside > 0) {
        rows.push({
            shiftName: OUTSIDE_SHIFT,
            displayName: 'Ngoài giờ ca',
            startTime: '22:00',
            endTime: '08:00',
            orderCount: outside,
            percentage: (outside / total) * 100,
            // Xám trung tính: không thuộc thang xanh của bốn ca, vì nó không
            // phải một ca.
            // Nhạt: không phải một ca, nên không được lấn át bốn ca thật.
            color: 'var(--rims-surface-3)',
        })
    }

    return rows
}

/**
 * Ca đông nhất — hoặc null khi chưa ca nào có đơn.
 *
 * <p>Backend vẫn trả "Ca sáng" khi mọi ca đều 0 đơn (nó lấy phần tử đầu), và
 * cả hai màn từng in thẳng cái tên đó ra ô "Ca nhiều đơn nhất". Ca có 0 đơn
 * không phải ca nhiều đơn nhất. "Ngoài giờ ca" cũng không được tính — nó
 * không phải một ca để khen.
 */
export function pickBusiestShift(rows: ShiftViewItem[]): ShiftViewItem | null {
    const real = rows.filter((row) => row.shiftName !== OUTSIDE_SHIFT)
    const best = real.reduce<ShiftViewItem | null>(
        (top, row) => (top == null || row.orderCount > top.orderCount ? row : top),
        null,
    )

    return best && best.orderCount > 0 ? best : null
}

export function buildDonutGradient(rows: ShiftViewItem[]) {
    const totalOrders = rows.reduce((sum, row) => sum + row.orderCount, 0)

    // HAI điểm dừng, không phải một: conic-gradient chỉ có một màu là cú pháp
    // sai, và trình duyệt bỏ luôn cả nền — vòng tròn rỗng biến mất.
    if (totalOrders === 0) {
        return 'var(--rims-chart-empty) 0deg 360deg'
    }

    let cursor = 0

    return rows
        .map((row, index) => {
            const degrees =
                index === rows.length - 1
                    ? 360 - cursor
                    : (row.orderCount / totalOrders) * 360
            const nextCursor = cursor + degrees
            const segment = `${row.color} ${cursor}deg ${nextCursor}deg`

            cursor = nextCursor

            return segment
        })
        .join(', ')
}
