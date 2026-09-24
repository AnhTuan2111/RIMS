import type {ReactNode} from 'react'

export type TableStatus = 'AVAILABLE' | 'SERVING' | 'RESERVED'

interface TableCardProps {
    tableNumber: string
    /** Sức chứa. Màn thu ngân không có dữ liệu này nên để trống được. */
    capacity?: number | null
    status: TableStatus
    statusLabel: string
    /** Tiền tạm tính của đơn đang mở — thu ngân cần thấy ngay, khỏi bấm vào. */
    amount?: number | null
    /** Giờ của lượt đặt bàn sắp tới, dạng "18:30". */
    upcomingTime?: string | null
    /** Bàn đang được chọn trong phiên làm việc. */
    isSelected?: boolean
    /** Có thay đổi cần chú ý (món mới, ghi chú từ bếp). */
    hasAlert?: boolean
    alertLabel?: string
    /** Nội dung phụ tuỳ màn, đặt dưới cùng. */
    footer?: ReactNode
    onClick: () => void
}

const STATUS_MODIFIER: Record<TableStatus, string> = {
    AVAILABLE: 'rk-tablecard--ok',
    SERVING: 'rk-tablecard--busy',
    RESERVED: 'rk-tablecard--brand',
}

const CHIP_MODIFIER: Record<TableStatus, string> = {
    AVAILABLE: 'rk-chip--ok',
    SERVING: 'rk-chip--busy',
    RESERVED: 'rk-chip--brand',
}

function formatAmount(value: number) {
    return `${value.toLocaleString('vi-VN')} đ`
}

/**
 * Thẻ bàn dùng chung cho màn Phục vụ và màn Thu ngân.
 *
 * <p>Trước đây hai màn cùng vẽ 12 cái bàn nhưng khác nhau mọi thứ: nhãn
 * ("Bàn T01 - 2 chỗ" so với "T01"), cách viết hoa ("Đang phục vụ" so với
 * "Đang Phục Vụ"), màu, bố cục. Gộp về một component để hai vai trò nhìn
 * cùng một sơ đồ bàn và nói cùng một ngôn ngữ khi trao đổi với nhau.
 */
export function TableCard({
    tableNumber,
    capacity,
    status,
    statusLabel,
    amount,
    upcomingTime,
    isSelected = false,
    hasAlert = false,
    alertLabel = 'Có cập nhật',
    footer,
    onClick,
}: TableCardProps) {
    const className = [
        'rk-tablecard',
        STATUS_MODIFIER[status],
        isSelected ? 'rk-tablecard--selected' : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button type="button" className={className} onClick={onClick}>
            <span className="rk-tablecard__top">
                <span className="rk-tablecard__no">{tableNumber}</span>

                {capacity != null && (
                    <span className="rk-tablecard__seats">{capacity} chỗ</span>
                )}
            </span>

            <span className="rk-tablecard__foot">
                <span className={`rk-chip ${CHIP_MODIFIER[status]}`}>{statusLabel}</span>

                {amount != null && amount > 0 && (
                    <span className="rk-tablecard__amount">{formatAmount(amount)}</span>
                )}
            </span>

            {upcomingTime && (
                <span className="rk-tablecard__hint">Đã đặt lúc {upcomingTime}</span>
            )}

            {hasAlert && (
                <span className="rk-tablecard__alert">
                    <span className="rk-tablecard__alert-dot" aria-hidden="true" />
                    {alertLabel}
                </span>
            )}

            {footer}
        </button>
    )
}
