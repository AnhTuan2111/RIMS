import {ORDER_ITEM_STATUS_LABELS, type OrderItemStatus} from '@/shared/types/order'

/**
 * Lớp chip theo trạng thái món.
 *
 * <p>Trước đây mỗi màn ghép chuỗi thẳng trong JSX:
 * `waiter-badge-${status.toLowerCase()}`. Cách đó không kiểm tra được lúc
 * biên dịch — thêm một trạng thái mới thì chip rơi về không có màu mà
 * không ai biết.
 */
export function statusChipClass(status?: string | null): string {
    switch ((status ?? '').toUpperCase()) {
        case 'COMPLETED':
            return 'rk-chip--ok'
        case 'PREPARING':
            return 'rk-chip--busy'
        case 'CANCELLED':
            return 'rk-chip--alert'
        default:
            return 'rk-chip--idle'
    }
}

/**
 * Nhãn tiếng Việt cho trạng thái món.
 *
 * <p>Hai màn Phục vụ trước đây in thẳng giá trị enum, nên giữa một bảng
 * tiếng Việt lại hiện ra "PREPARING" và "COMPLETED". Bản đồ nhãn đã có
 * sẵn trong shared/types/order, chỉ là không ai gọi.
 *
 * <p>Nhận `string | undefined` vì API có thể không trả trường này.
 */
export function statusLabel(status?: string | null): string {
    if (!status) {
        return '—'
    }

    return ORDER_ITEM_STATUS_LABELS[status as OrderItemStatus] ?? status
}
