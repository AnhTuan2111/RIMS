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
