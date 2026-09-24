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
        <div className="rims-feedback-state rims-feedback-error">
            <div className="rims-feedback-icon error">
                <TriangleAlert className="rims-feedback-glyph" aria-hidden="true" />
            </div>

            <div>
                <h3>{title}</h3>
                <p>{displayMessage}</p>

                {(onRetry || action) && (
                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap mt-3">
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
