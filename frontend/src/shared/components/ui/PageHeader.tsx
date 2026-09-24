import type {ReactNode} from 'react'

type PageHeaderProps = {
    title: ReactNode
    description?: ReactNode
    eyebrow?: ReactNode
    actions?: ReactNode
    icon?: ReactNode
    className?: string
}

export function PageHeader({
    title,
    description,
    eyebrow,
    actions,
    icon,
    className,
}: PageHeaderProps) {
    return (
        <header className={className ? `rk-pagehead ${className}` : 'rk-pagehead'}>
            <div className="rk-pagehead__lead">
                {icon && <div className="rk-pagehead__icon">{icon}</div>}

                <div className="rk-pagehead__body">
                    {eyebrow && <div className="rk-pagehead__eyebrow">{eyebrow}</div>}

                    <h2 className="rk-pagehead__title">{title}</h2>

                    {description && <p className="rk-pagehead__desc">{description}</p>}
                </div>
            </div>

            {actions && <div className="rk-pagehead__actions">{actions}</div>}
        </header>
    )
}
