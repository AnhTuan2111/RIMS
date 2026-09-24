import type {ReactNode} from 'react'
import {TriangleAlert} from 'lucide-react'

type ErrorStateProps = {
    title?: string
    message?: string
    description?: string
    onRetry?: () => void
    retryLabel?: string
    action?: ReactNode
}

export function ErrorState({
    title = 'Không thể tải dữ liệu',
    message,
    description,
    onRetry,
    retryLabel = 'Thử lại',
    action,
}: ErrorStateProps) {
    const displayMessage = message ?? description ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'

    return (
        <div className="rk-feedback">
            <div className="rk-feedback__icon rk-feedback__icon--alert">
                <TriangleAlert className="rk-icon" aria-hidden="true" />
            </div>

            <div>
                <h3 className="rk-feedback__title">{title}</h3>
                <p className="rk-feedback__text">{displayMessage}</p>

                {(onRetry || action) && (
                    <div className="rk-feedback__actions">
                        {onRetry && (
                            <button
                                type="button"
                                className="rk-btn rk-btn--danger"
                                onClick={onRetry}
                            >
                                {retryLabel}
                            </button>
                        )}

                        {action}
                    </div>
                )}
            </div>
        </div>
    )
}
