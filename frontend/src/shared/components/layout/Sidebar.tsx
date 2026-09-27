import {NavLink, useLocation} from 'react-router-dom'

import {matchMenu, roleMenus} from '@/app/config/roleMenus'
import {useActor} from '@/app/providers/ActorContext'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {Icon} from '@/shared/components/ui/Icon'

type SidebarProps = {
    /** Dưới 60rem rail là ngăn kéo; cờ này quyết định nó đang trượt ra hay ẩn. */
    open: boolean
    onClose: () => void
}

/**
 * Rail điều hướng — dải dọc 4,6rem bên trái.
 *
 * <p>Bản cũ là thanh bên 264px chứa tên quán, khẩu hiệu, nhãn vai trò, danh sách
 * menu, nút đổi chế độ và tên người dùng. Sáu khối cho một việc duy nhất là đi
 * tới màn khác.
 *
 * <p>Nay rail chỉ làm đúng việc đó: icon một nét kèm nhãn chữ ngắn bên dưới.
 * Những thứ kia chuyển sang hàng breadcrumb, hoặc bỏ hẳn — tên người dùng không
 * giúp gì cho việc đang làm.
 *
 * <p>Ô đang mở tô ĐỎ. Đỏ ở vỏ app là nhận diện; đỏ trên nút là phá huỷ. Cùng một
 * mã màu, phân biệt bằng vị trí.
 */
export function Sidebar({open, onClose}: SidebarProps) {
    const {actor} = useActor()
    const {profile} = useRestaurant()
    const location = useLocation()
    const entries = roleMenus[actor] ?? []
    const {entry: activeEntry} = matchMenu(actor, location.pathname)

    // Chữ cái đầu tên quán làm dấu nhận diện. Hồ sơ chưa tải xong thì để trống —
    // không gõ cứng chuỗi dự phòng, vì app chạy cho một nhà hàng có tên thật.
    const brandInitial = (profile?.name ?? '').trim().charAt(0).toUpperCase()

    return (
        <aside className={`rk-rail${open ? ' is-open' : ''}`}>
            <button
                type="button"
                className="rk-rail__close"
                aria-label="Đóng menu"
                onClick={onClose}
            >
                <Icon name="x" className="rk-icon" />
            </button>

            <NavLink to="/" className="rk-rail__brand" aria-label={profile?.name ?? 'Trang chủ'}>
                {brandInitial}
            </NavLink>

            <nav className="rk-rail__nav" aria-label="Điều hướng chính">
                {entries.map((entry) => (
                    <NavLink
                        key={entry.path}
                        to={entry.path}
                        onClick={onClose}
                        className={
                            entry === activeEntry ? 'rk-rail__item is-on' : 'rk-rail__item'
                        }
                        // Nhóm có nhiều màn con: chỉ ô rail của NHÓM được tô, việc
                        // chọn màn nào trong nhóm là của băng mục con bên dưới.
                        aria-current={entry === activeEntry ? 'page' : undefined}
                    >
                        <Icon name={entry.icon} className="rk-icon" />
                        <span className="rk-rail__label">{entry.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}
