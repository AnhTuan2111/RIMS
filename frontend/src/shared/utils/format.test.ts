import {describe, expect, it} from 'vitest'

import {
    formatCurrency,
    formatDateForApi,
    formatNumber,
    getWeekEnd,
    getWeekStart,
} from './format'

describe('Định dạng hiển thị', () => {
    describe('Tiền', () => {
        it('nhóm hàng nghìn theo kiểu Việt Nam', () => {
            expect(formatCurrency(150000)).toBe('150.000 đ')
            expect(formatCurrency(1263000)).toBe('1.263.000 đ')
        })

        it('số 0 vẫn hiện ra chứ không để trống', () => {
            expect(formatCurrency(0)).toBe('0 đ')
        })

        it('giá trị thiếu coi như 0, không hiện NaN', () => {
            expect(formatCurrency(undefined as unknown as number)).toBe('0 đ')
            expect(formatNumber(null as unknown as number)).toBe('0')
        })
    })

    describe('Ngày gửi lên API', () => {
        it('luôn đủ hai chữ số cho tháng và ngày', () => {
            expect(formatDateForApi(new Date(2026, 0, 5))).toBe('2026-01-05')
            expect(formatDateForApi(new Date(2026, 11, 31))).toBe('2026-12-31')
        })
    })

    describe('Tuần bắt đầu từ thứ Hai', () => {
        it('giữa tuần thì lùi về thứ Hai cùng tuần', () => {
            // 2026-09-24 là thứ Năm
            const start = getWeekStart(new Date(2026, 8, 24))

            expect(formatDateForApi(start)).toBe('2026-09-21')
            expect(start.getDay()).toBe(1)
        })

        it('chính thứ Hai thì giữ nguyên', () => {
            const start = getWeekStart(new Date(2026, 8, 21))

            expect(formatDateForApi(start)).toBe('2026-09-21')
        })

        it('Chủ nhật thuộc về tuần TRƯỚC, không phải tuần sau', () => {
            // Chỗ này là lỗi kinh điển: getDay() trả 0 cho Chủ nhật, nếu tính
            // ngây thơ sẽ nhảy sang thứ Hai của tuần kế tiếp.
            const start = getWeekStart(new Date(2026, 8, 27))

            expect(formatDateForApi(start)).toBe('2026-09-21')
        })

        it('bắc qua đầu tháng vẫn đúng', () => {
            // 2026-10-01 là thứ Năm, thứ Hai cùng tuần rơi vào tháng 9
            const start = getWeekStart(new Date(2026, 9, 1))

            expect(formatDateForApi(start)).toBe('2026-09-28')
        })

        it('cuối tuần là Chủ nhật, cách đầu tuần đúng 6 ngày', () => {
            const ngay = new Date(2026, 8, 24)
            const start = getWeekStart(ngay)
            const end = getWeekEnd(ngay)

            expect(formatDateForApi(end)).toBe('2026-09-27')
            expect(end.getDay()).toBe(0)

            // Đếm theo NGÀY LỊCH chứ không theo mili giây: cuối tuần là
            // 23:59:59.999 nên hiệu số mili giây gần 7 ngày chứ không tròn 6.
            const soNgay =
                (new Date(formatDateForApi(end)).getTime() -
                    new Date(formatDateForApi(start)).getTime()) /
                86400000
            expect(soNgay).toBe(6)
        })

        it('đầu tuần là 00:00:00, cuối tuần là 23:59:59', () => {
            const ngay = new Date(2026, 8, 24, 13, 45)

            expect(getWeekStart(ngay).getHours()).toBe(0)
            expect(getWeekEnd(ngay).getHours()).toBe(23)
            expect(getWeekEnd(ngay).getMinutes()).toBe(59)
        })

        it('không sửa đổi đối tượng Date truyền vào', () => {
            const ngay = new Date(2026, 8, 24)
            const truoc = ngay.getTime()

            getWeekStart(ngay)
            getWeekEnd(ngay)

            expect(ngay.getTime()).toBe(truoc)
        })
    })
})
