import {useCallback, useEffect, useState} from 'react'
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom'

import {matchMenu} from '@/app/config/roleMenus'
import {useActor} from '@/app/providers/ActorContext'
import {useAuth} from '@/app/providers/AuthContext'
import {Sidebar} from '@/shared/components/layout/Sidebar'

import {DashboardTopbar} from './DashboardTopbar'

/**
 * Khung của mọi màn sau đăng nhập.
 *
 * <p>Ba tầng: rail dọc bên trái · hàng breadcrumb kèm đồng hồ · băng mục con
 * (chỉ ở Quản trị) · nội dung.
 *
 * <p>Dưới 60rem rail là một ngăn kéo trượt từ mép trái. Bản cũ chỉ xếp thanh bên
 * lên trên nội dung ở màn hẹp, nên trên điện thoại mỗi trang đều bắt người dùng
 * cuộn qua toàn bộ menu mới tới việc cần làm.
 *
 * <p>Ngăn kéo tự đóng khi đổi đường dẫn — bấm một mục menu là vào màn đó, giữ
 * ngăn kéo mở thêm chỉ che mất màn vừa mở.
 */
export default function DashboardLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const {logout} = useAuth()
    const {actor} = useActor()

    // Băng mục con chỉ hiện ở vai có NHÓM — tức là Quản trị. Bốn vai kia để menu
    // phẳng nên không có băng, và hàng breadcrumb dính luôn vào nội dung.
    const {entry: activeEntry, item: activeItem} = matchMenu(actor, location.pathname)
    const belt = activeEntry?.items ?? []

    /*
     * Ngăn kéo không lưu "đang mở" mà lưu "mở ở đường dẫn nào".
     *
     * Bản đầu dùng một useEffect để đóng ngăn kéo mỗi khi đường dẫn đổi —
     * đặt state trong effect, nghĩa là vẽ một lần thừa với ngăn kéo còn mở rồi mới
     * đóng. So sánh thẳng với đường dẫn hiện tại thì nó đóng ngay trong lần vẽ đó.
     */
    const [openedAt, setOpenedAt] = useState<string | null>(null)
    const drawerOpen = openedAt === location.pathname

    const closeDrawer = useCallback(() => setOpenedAt(null), [])

    // Esc đóng ngăn kéo — bàn phím phải thoát ra được mà không cần chuột.
    useEffect(() => {
        if (!drawerOpen) {
            return
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpenedAt(null)
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [drawerOpen])

    // Khoá cuộn nền khi ngăn kéo mở, nếu không ngón tay vuốt trong ngăn kéo
    // sẽ kéo cả trang phía sau.
    useEffect(() => {
        document.body.classList.toggle('rk-drawer-open', drawerOpen)
        return () => document.body.classList.remove('rk-drawer-open')
    }, [drawerOpen])

    async function handleLogout() {
        await logout()
        navigate('/login', {replace: true})
    }

    return (
        <div className="rk-shell">
            <Sidebar open={drawerOpen} onClose={closeDrawer} />

            {drawerOpen && (
                <button
                    type="button"
                    className="rk-shell__scrim"
                    aria-label="Đóng menu"
                    onClick={closeDrawer}
                />
            )}

            <div className="rk-shell__main">
                <DashboardTopbar
                    onLogout={handleLogout}
                    onOpenMenu={() => setOpenedAt(location.pathname)}
                />

                {belt.length > 0 && (
                    <nav className="rk-belt" aria-label="Màn trong nhóm">
                        {belt.map((sub) => (
                            <NavLink
                                key={sub.path}
                                to={sub.path}
                                className={sub === activeItem ? 'is-on' : undefined}
                            >
                                {sub.label}
                            </NavLink>
                        ))}
                    </nav>
                )}

                <main className="rk-shell__content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
