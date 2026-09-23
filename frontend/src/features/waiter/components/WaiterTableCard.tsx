import type {TableDetailResponse} from '@/shared/api/waiter'
import {TableCard, type TableStatus} from '@/shared/components/ui'

interface WaiterTableCardProps {
    table: TableDetailResponse
    status: TableStatus
    statusLabel: string
    nextReservationTime?: string
    hasStatusNotification?: boolean
    onClick: (table: TableDetailResponse) => void
}

/**
 * Lớp mỏng bọc quanh TableCard dùng chung.
 *
 * <p>Giữ nguyên chữ ký cũ để các màn của Phục vụ không phải sửa, nhưng phần
 * hiển thị nay dùng đúng component mà màn Thu ngân dùng — trước đây hai màn
 * vẽ cùng 12 cái bàn theo hai kiểu khác nhau.
 */
export function WaiterTableCard({
    table,
    status,
    statusLabel,
    nextReservationTime,
    hasStatusNotification = false,
    onClick,
}: WaiterTableCardProps) {
    // Bàn còn trống nhưng đã có người đặt trước: phục vụ cần biết để không
    // xếp khách vãng lai vào.
    const reservedSoon =
        status === 'AVAILABLE' && table.upcomingReservationTime
            ? table.upcomingReservationTime.split('T')[1]?.substring(0, 5)
            : undefined

    return (
        <TableCard
            tableNumber={`Bàn ${table.tableNumber}`}
            capacity={table.capacity}
            status={status}
            statusLabel={statusLabel}
            upcomingTime={status === 'RESERVED' ? nextReservationTime : reservedSoon}
            hasAlert={hasStatusNotification}
            alertLabel="Có cập nhật món"
            onClick={() => onClick(table)}
        />
    )
}
