import type {ReactNode} from 'react'

type EmptyStateProps = {
    title?: string
    description?: string
    action?: ReactNode
    icon?: ReactNode
}

/**
 * Trạng thái rỗng dùng chung.
 *
 * <p>Mặc định KHÔNG có biểu tượng: hệ "Phiếu bếp" diễn tả trạng thái rỗng bằng
 * dải SỌC KẺ CHÉO, một trong sáu thủ pháp retro đã chốt, và là thủ pháp không
 * tiêu màu nào. Màn nào muốn đặt biểu tượng riêng thì truyền qua prop icon.
 */
export function EmptyState({
    title = 'Chưa có dữ liệu',
    description = 'Khi có dữ liệu mới, thông tin sẽ được hiển thị tại đây.',
    action,
    icon,
}: EmptyStateProps) {
    return (
        <div className="rk-feedback">
            <div className="rk-feedback__icon" aria-hidden="true">
                {icon}
            </div>

            <div>
                <h3 className="rk-feedback__title">{title}</h3>

                {description && <p className="rk-feedback__text">{description}</p>}

                {action && <div className="rk-feedback__actions">{action}</div>}
            </div>
        </div>
    )
}
