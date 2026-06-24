import { NavLink } from 'react-router-dom'
import {
    ROLE_LABELS,
    roleMenus,
} from '../../config/roleMenus'
import { useActor } from '../../context/ActorContext'

function getMenuIcon(path: string) {
    if (path.includes('dashboard')) return '▦'
    if (path.includes('completed')) return '✓'
    if (path.includes('orders')) return '⌁'
    if (path.includes('dishes')) return '◉'
    if (path.includes('tables')) return '▤'
    if (path.includes('reservations')) return '◷'
    if (path.includes('payments')) return '₫'
    if (path.includes('invoices')) return '▧'
    if (path.includes('users')) return '♙'

    return '•'
}

export function Sidebar() {
    const { actor } = useActor()
    const menus = roleMenus[actor]

    return (
        <aside className="app-sidebar rims-sidebar">
            <div className="rims-sidebar-brand">
                <div className="rims-sidebar-logo">
                    R
                </div>

                <div>
                    <h2>RIMS</h2>
                    <p>Restaurant Operations</p>
                </div>
            </div>

            <div className="rims-sidebar-role">
                <div className="rims-role-icon">
                    ✦
                </div>

                <div>
                    <small>Không gian làm việc</small>
                    <strong>{ROLE_LABELS[actor]}</strong>
                </div>
            </div>

            <nav className="rims-sidebar-nav">
                <p className="rims-sidebar-title">
                    CHỨC NĂNG
                </p>

                {menus.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? 'rims-sidebar-link active'
                                : 'rims-sidebar-link'
                        }
                    >
                        <span className="rims-menu-icon">
                            {getMenuIcon(item.path)}
                        </span>

                        <span className="rims-menu-label">
                            {item.label}
                        </span>

                        <span className="rims-menu-arrow">
                            ›
                        </span>
                    </NavLink>
                ))}
            </nav>

            <div className="rims-sidebar-status">
                <span className="rims-online-dot" />

                <div>
                    <strong>Hệ thống hoạt động</strong>
                    <small>Kết nối backend ổn định</small>
                </div>
            </div>
        </aside>
    )
}
