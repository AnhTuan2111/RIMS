type LoadingStateProps = {
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
    title = 'Đang tải dữ liệu…',
    description = 'Hệ thống đang đồng bộ thông tin mới nhất.',
    size = 'md',
}: LoadingStateProps) {
    const sizeClass = size === 'md' ? '' : ` rk-feedback--${size}`

    return (
        <div className={`rk-feedback${sizeClass}`}>
            <div className="rk-feedback__icon">
                <span className="rk-spinner" role="status" aria-label={title} />
            </div>

            <div>
                <h3 className="rk-feedback__title">{title}</h3>
                {description && <p className="rk-feedback__text">{description}</p>}
            </div>
        </div>
    )
}
