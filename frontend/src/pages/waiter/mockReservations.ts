export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'FULFILLED';

export type Reservation = {
    id: string;
    tableId: number;
    customerName: string;
    phone: string;
    date: string;
    time: string;
    note: string;
    status: ReservationStatus;
};

export const RESERVE_LEAD_MS = 30 * 60 * 1000;
export const RESERVE_GRACE_MS = 30 * 60 * 1000;
export const SERVICE_DURATION_MS = 2 * 60 * 60 * 1000;
export const MIN_RESERVATION_GAP_MS = 2 * 60 * 60 * 1000;

let reservations: Reservation[] = [
    {
        id: 'R001',
        tableId: 1,
        customerName: 'Trần Minh Châu',
        phone: '0912 345 678',
        date: '2026-06-19',
        time: '16:00',
        note: 'Sinh nhật, cần trang trí bàn',
        status: 'ACTIVE',
    },
    {
        id: 'R002',
        tableId: 2,
        customerName: 'Lê Thị Hồng',
        phone: '0987 654 321',
        date: '2026-06-19',
        time: '16:30',
        note: 'Dị ứng hải sản',
        status: 'ACTIVE',
    },
];

let nextResId = 10;

export function reservationStartMs(res: Pick<Reservation, 'date' | 'time'>): number {
    return new Date(`${res.date}T${res.time}:00`).getTime();
}

export function isReservationActive(res: Reservation): boolean {
    return res.status === 'ACTIVE';
}

export function isInReservedDisplayWindow(res: Reservation, nowMs = Date.now()): boolean {
    if (!isReservationActive(res)) return false;
    const start = reservationStartMs(res);
    return nowMs >= start - RESERVE_LEAD_MS && nowMs <= start + RESERVE_GRACE_MS;
}

export function isInServiceBlock(
    res: Reservation,
    date: string,
    time: string,
): boolean {
    if (!isReservationActive(res)) return false;
    const blockStart = reservationStartMs(res);
    const blockEnd = blockStart + SERVICE_DURATION_MS;
    const candidateStart = new Date(`${date}T${time}:00`).getTime();
    const candidateEnd = candidateStart + SERVICE_DURATION_MS;
    return candidateStart < blockEnd && candidateEnd > blockStart;
}

export function hasTimeConflict(
    list: Reservation[],
    tableId: number,
    date: string,
    time: string,
    excludeId: string | null = null,
): boolean {
    return list
        .filter((r) => isReservationActive(r) && r.tableId === tableId && r.id !== excludeId)
        .some((r) => isInServiceBlock(r, date, time));
}

export function processAutoCancellations(nowMs = Date.now()): boolean {
    let changed = false;
    reservations = reservations.map((r) => {
        if (!isReservationActive(r)) return r;
        const deadline = reservationStartMs(r) + RESERVE_GRACE_MS;
        if (nowMs > deadline) {
            changed = true;
            return {...r, status: 'CANCELLED'};
        }
        return r;
    });
    return changed;
}

export function getReservations(): Reservation[] {
    processAutoCancellations();
    return reservations;
}

export function getActiveReservations(): Reservation[] {
    return getReservations().filter(isReservationActive);
}

export function getReservation(id: string): Reservation | undefined {
    processAutoCancellations();
    return reservations.find((r) => r.id === id);
}

export function getActiveReservationForTable(
    tableId: number,
    nowMs = Date.now(),
): Reservation | undefined {
    return getActiveReservations()
        .filter((r) => r.tableId === tableId && isInReservedDisplayWindow(r, nowMs))
        .sort((a, b) => reservationStartMs(a) - reservationStartMs(b))[0];
}

export function getNextReservationForTable(tableId: number): Reservation | undefined {
    const nowMs = Date.now();
    return getActiveReservations()
        .filter((r) => r.tableId === tableId && reservationStartMs(r) >= nowMs - RESERVE_GRACE_MS)
        .sort((a, b) => reservationStartMs(a) - reservationStartMs(b))[0];
}

export function addReservation(res: Omit<Reservation, 'id' | 'status'>) {
    const id = `R${String(nextResId++).padStart(3, '0')}`;
    const newRes: Reservation = {...res, id, status: 'ACTIVE'};
    reservations = [...reservations, newRes];
    return newRes;
}

export function updateReservation(id: string, updates: Partial<Omit<Reservation, 'id'>>) {
    reservations = reservations.map((r) => (r.id === id ? {...r, ...updates} : r));
}

export function cancelReservation(id: string) {
    updateReservation(id, {status: 'CANCELLED'});
}

export function fulfillReservationForTable(tableId: number, nowMs = Date.now()) {
    const active = getActiveReservationForTable(tableId, nowMs);
    if (active) {
        updateReservation(active.id, {status: 'FULFILLED'});
    }
}

export type EffectiveTableStatus = 'AVAILABLE' | 'SERVING' | 'RESERVED';

export function getEffectiveTableStatus(
    apiStatus: string,
    tableId: number,
    nowMs = Date.now(),
): EffectiveTableStatus {
    if (apiStatus === 'SERVING') return 'SERVING';
    if (getActiveReservationForTable(tableId, nowMs)) return 'RESERVED';
    return 'AVAILABLE';
}

export function validateReservationForm(
    list: Reservation[],
    tableId: number,
    date: string,
    time: string,
    excludeId: string | null = null,
): string | null {
    if (!date || !time) return 'Vui lòng chọn ngày và giờ đặt bàn.';
    const startMs = new Date(`${date}T${time}:00`).getTime();
    if (Number.isNaN(startMs)) return 'Ngày hoặc giờ không hợp lệ.';

    if (hasTimeConflict(list, tableId, date, time, excludeId)) {
        return 'Bàn này đã có đặt chỗ trong khoảng 2 giờ phục vụ. Các lịch đặt phải cách nhau ít nhất 2 giờ.';
    }
    return null;
}
