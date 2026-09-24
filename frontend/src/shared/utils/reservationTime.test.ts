import {describe, expect, it} from 'vitest'

import {
    generateAllTimeSlots,
    getAvailableTimeSlots,
    parseReservationWindow,
    RESERVATION_CLOSE_HOUR,
    RESERVATION_OPEN_HOUR,
} from './reservationTime'

/**
 * Các quy tắc ở đây phải khớp với ReservationWindow và
 * ReservationConflictValidator bên backend. Lệch nhau thì khách chọn được một
 * khung giờ mà gửi lên lại bị từ chối.
 */
describe('Khung giờ đặt bàn', () => {
    describe('Đọc khung giờ từ cấu hình', () => {
        it('đọc đúng chuỗi backend trả về', () => {
            expect(parseReservationWindow('08:00 - 20:00')).toEqual({
                openHour: 8,
                closeHour: 20,
            })
        })

        it('chấp nhận khoảng trắng thừa quanh dấu gạch', () => {
            expect(parseReservationWindow('09:00-21:00')).toEqual({
                openHour: 9,
                closeHour: 21,
            })
        })

        it('chuỗi rác thì dùng giá trị dự phòng', () => {
            for (const bad of ['', 'cả ngày', '8h-20h', null, undefined]) {
                expect(parseReservationWindow(bad)).toEqual({
                    openHour: RESERVATION_OPEN_HOUR,
                    closeHour: RESERVATION_CLOSE_HOUR,
                })
            }
        })
    })

    describe('Sinh danh sách giờ', () => {
        it('bắt đầu ở giờ mở cửa và kết thúc ở giờ chốt', () => {
            const slots = generateAllTimeSlots()

            expect(slots[0]).toBe('08:00')
            expect(slots.at(-1)).toBe('20:00')
        })

        it('cách nhau đúng 30 phút', () => {
            const slots = generateAllTimeSlots()

            expect(slots.slice(0, 5)).toEqual([
                '08:00',
                '08:30',
                '09:00',
                '09:30',
                '10:00',
            ])
        })

        it('theo đúng khung giờ được truyền vào', () => {
            const slots = generateAllTimeSlots({openHour: 10, closeHour: 12})

            expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30', '12:00'])
        })
    })

    describe('Lọc giờ còn đặt được', () => {
        /** Một ngày ở tương lai xa, để test không phụ thuộc lúc chạy. */
        const NGAY_XA = '2099-06-15'

        it('không có lịch bận thì còn nguyên danh sách', () => {
            expect(getAvailableTimeSlots(NGAY_XA, [])).toEqual(generateAllTimeSlots())
        })

        it('bỏ các giờ nằm trong khoảng đã có người đặt', () => {
            const slots = getAvailableTimeSlots(NGAY_XA, [
                {start: `${NGAY_XA}T11:00:00`, end: `${NGAY_XA}T13:30:00`},
            ])

            expect(slots).not.toContain('12:00')
            expect(slots).not.toContain('13:00')
        })

        it('đúng hai đầu biên thì vẫn đặt được', () => {
            // Backend dùng isAfter/isBefore không kèm bằng, nên đúng mốc 150 phút
            // là hợp lệ. Hai bên phải giống nhau ở chỗ này.
            const slots = getAvailableTimeSlots(NGAY_XA, [
                {start: `${NGAY_XA}T11:00:00`, end: `${NGAY_XA}T13:30:00`},
            ])

            expect(slots).toContain('11:00')
            expect(slots).toContain('13:30')
        })

        it('bỏ các giờ đã trôi qua', () => {
            const homNay = new Date().toISOString().slice(0, 10)
            const slots = getAvailableTimeSlots(homNay, [])

            for (const time of slots) {
                expect(new Date(`${homNay}T${time}:00`).getTime()).toBeGreaterThan(
                    Date.now(),
                )
            }
        })

        it('nhiều khoảng bận thì loại hết các khoảng đó', () => {
            const slots = getAvailableTimeSlots(NGAY_XA, [
                {start: `${NGAY_XA}T08:00:00`, end: `${NGAY_XA}T10:30:00`},
                {start: `${NGAY_XA}T14:00:00`, end: `${NGAY_XA}T16:30:00`},
            ])

            expect(slots).not.toContain('09:00')
            expect(slots).not.toContain('15:00')
            expect(slots).toContain('12:00')
        })

        it('dùng đúng khung giờ truyền vào khi lọc', () => {
            const slots = getAvailableTimeSlots(NGAY_XA, [], {
                openHour: 17,
                closeHour: 19,
            })

            expect(slots).toEqual(['17:00', '17:30', '18:00', '18:30', '19:00'])
        })
    })
})
