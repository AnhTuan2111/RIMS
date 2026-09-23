/*
 * Giá trị dự phòng khi chưa đọc được cấu hình từ backend. Nguồn thật là
 * ReservationWindow ở backend, trả về qua trường reservationHours.
 */
export const RESERVATION_OPEN_HOUR = 8
export const RESERVATION_CLOSE_HOUR = 20
export const RESERVATION_SLOT_STEP_MINUTES = 30

export interface ReservationWindow {
    openHour: number
    closeHour: number
}

/**
 * Đọc chuỗi dạng "08:00 - 20:00" từ backend.
 *
 * <p>Không đọc được thì dùng giá trị dự phòng, để màn đặt bàn vẫn dùng được
 * thay vì trống trơn.
 */
export function parseReservationWindow(text?: string | null): ReservationWindow {
    const match = text?.match(/^(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}$/)

    if (!match) {
        return {
            openHour: RESERVATION_OPEN_HOUR,
            closeHour: RESERVATION_CLOSE_HOUR,
        }
    }

    return {openHour: Number(match[1]), closeHour: Number(match[2])}
}

export interface BlockedRange {
    start: string
    end: string
}

export function generateAllTimeSlots(
    window: ReservationWindow = {
        openHour: RESERVATION_OPEN_HOUR,
        closeHour: RESERVATION_CLOSE_HOUR,
    },
): string[] {
    const slots: string[] = []
    const startMinutes = window.openHour * 60
    const endMinutes = window.closeHour * 60

    for (
        let minutes = startMinutes;
        minutes <= endMinutes;
        minutes += RESERVATION_SLOT_STEP_MINUTES
    ) {
        const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
        const minute = String(minutes % 60).padStart(2, '0')
        slots.push(`${hour}:${minute}`)
    }

    return slots
}

function isSlotBlocked(
    date: string,
    time: string,
    blockedRanges: BlockedRange[],
): boolean {
    const candidate = new Date(`${date}T${time}:00`)

    return blockedRanges.some((range) => {
        const start = new Date(range.start)
        const end = new Date(range.end)
        // Cả 2 phía đều strict (không bao gồm bằng), khớp với
        // ReservationConflictValidator.hasConflict ở backend (isAfter/isBefore
        // không kèm bằng) — đúng biên 150 phút (2.5 tiếng) thì được phép đặt.
        return candidate > start && candidate < end
    })
}

function isSlotInPast(date: string, time: string): boolean {
    const candidate = new Date(`${date}T${time}:00`)
    return candidate.getTime() <= Date.now()
}

export function getAvailableTimeSlots(
    date: string,
    blockedRanges: BlockedRange[],
    window?: ReservationWindow,
): string[] {
    return generateAllTimeSlots(window).filter((time) => {
        if (isSlotInPast(date, time)) {
            return false
        }

        if (isSlotBlocked(date, time, blockedRanges)) {
            return false
        }

        return true
    })
}
