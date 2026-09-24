import type {ReactNode} from 'react'
import {Inbox} from 'lucide-react'

type EmptyStateProps = {
    title?: string
    description?: string
    action?: ReactNode
    icon?: ReactNode
}

/**
 * Trạng thái rỗng dùng chung.
 *
 * <p>Biểu tượng mặc định trước đây là ký tự ∅, trông như lỗi phông chứ không
 * như một biểu tượng. Nay dùng SVG.
 */
export function EmptyState({
    title = 'Chưa có dữ liệu',
    description = 'Khi có dữ liệu mới, thông tin sẽ được hiển thị tại đây.',
    action,
    icon = <Inbox className="rk-icon" aria-hidden="true" />,
}: EmptyStateProps) {
    return (
        <div className="rk-feedback">
            <div className="rk-feedback__icon">{icon}</div>

            <div>
                <h3 className="rk-feedback__title">{title}</h3>

                {description && <p className="rk-feedback__text">{description}</p>}

                {action && <div className="rk-feedback__actions">{action}</div>}
            </div>
        </div>
    )
}
