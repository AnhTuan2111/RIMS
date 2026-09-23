import type {ReactNode} from 'react'

interface StatCardProps {
    label: string
    value: ReactNode
    /** Biểu tượng nhỏ bên phải. Chỉ để trang trí, không mang thông tin. */
    icon?: ReactNode
    /** Sắc nền. Mặc định là bề mặt trung tính. */
    tone?: 'plain' | 'brand' | 'ok' | 'busy' | 'alert'
    /** Giá trị là chữ (tên ca, tên danh mục) chứ không phải số. */
    textValue?: boolean
}

/**
 * Ô số liệu tóm tắt trên đầu các màn.
 *
 * <p>Khối này từng được chép lại 4 lần trong cùng một file và lặp thêm ở 3 màn
 * khác, mỗi nơi một bộ class riêng (admin-menu-stat-*, admin-category-stats-*,
 * admin-dish-stats-*) nhưng cùng một bố cục: nhãn nhỏ, số to, icon bên phải.
 */
export function StatCard({
    label,
    value,
    icon,
    tone = 'plain',
    textValue = false,
}: StatCardProps) {
    return (
        <div className={`rk-statcard rk-statcard--${tone}`}>
            <div>
                <span className="rk-stat__label">{label}</span>

                <span
                    className={`rk-stat__value ${textValue ? 'rk-stat__value--text' : ''}`}
                >
                    {value}
                </span>
            </div>

            {icon && (
                <span className="rk-statcard__icon" aria-hidden="true">
                    {icon}
                </span>
            )}
        </div>
    )
}
