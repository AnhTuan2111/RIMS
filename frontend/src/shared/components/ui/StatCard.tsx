import type {ReactNode} from 'react'
import {Link} from 'react-router-dom'

interface StatCardProps {
    label: string
    value: ReactNode
    /** Biểu tượng nhỏ bên phải. Chỉ để trang trí, không mang thông tin. */
    icon?: ReactNode
    /** Sắc nền. Mặc định là bề mặt trung tính. */
    tone?: 'plain' | 'brand' | 'ok' | 'busy' | 'alert'
    /** Giá trị là chữ (tên ca, tên danh mục) chứ không phải số. */
    textValue?: boolean
    /** Một dòng giải thích con số nói lên điều gì. */
    description?: string
    /** Có đường dẫn thì cả ô thành một liên kết. */
    to?: string
}

/**
 * Ô số liệu tóm tắt trên đầu các màn.
 *
 * <p>Khối này từng được chép lại 4 lần trong cùng một file và lặp thêm ở 3 màn
 * khác, mỗi nơi một bộ class riêng (admin-menu-stat-*, admin-category-stats-*,
 * admin-dish-stats-*) nhưng cùng một bố cục: nhãn nhỏ, số to, icon bên phải.
 *
 * <p>Màn Tổng quan bếp trước đây không dùng component này mà tự dựng bốn thẻ
 * bằng {@code <Link className="rk-statcard">} với ba khối con. Lớp rk-statcard
 * xếp ngang, nên ba khối đó bị nén thành ba cột hẹp và nhãn xuống dòng từng
 * chữ một. Thêm `to` và `description` để màn đó dùng chung khuôn.
 */
export function StatCard({
    label,
    value,
    icon,
    tone = 'plain',
    textValue = false,
    description,
    to,
}: StatCardProps) {
    const body = (
        <>
            <div>
                <span className="rk-stat__label">{label}</span>

                <span
                    className={`rk-stat__value ${textValue ? 'rk-stat__value--text' : ''}`}
                >
                    {value}
                </span>

                {description && <p className="rk-statcard__hint">{description}</p>}
            </div>

            {icon && (
                <span className="rk-statcard__icon" aria-hidden="true">
                    {icon}
                </span>
            )}
        </>
    )

    const className = `rk-statcard rk-statcard--${tone}`

    if (to) {
        return (
            <Link className={className} to={to}>
                {body}
            </Link>
        )
    }

    return <div className={className}>{body}</div>
}
