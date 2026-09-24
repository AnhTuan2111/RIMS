import type {HTMLAttributes, ReactNode} from 'react'

type PageCardProps = HTMLAttributes<HTMLElement> & {
    children: ReactNode
    variant?: 'default' | 'soft' | 'flush'
}

export function PageCard({
    children,
    className,
    variant = 'default',
    ...props
}: PageCardProps) {
    const variantClass =
        variant === 'soft' ? 'rk-card--soft' : variant === 'flush' ? 'rk-card--flush' : ''

    return (
        <section
            className={['rk-card', 'rk-card--pad', variantClass, className]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            {children}
        </section>
    )
}
