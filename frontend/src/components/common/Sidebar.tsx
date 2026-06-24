import { NavLink } from 'react-router-dom'
import {
    ROLE_LABELS,
    roleMenus,
} from '../../config/roleMenus'
import { useActor } from '../../context/ActorContext'

function StatisticsIcon() {
    return (
        <svg
            aria-hidden="true"
            className="rims-menu-svg-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
        >
            <rect x="5" y="11" width="3.5" height="7" rx="1" fill="currentColor" />
            <rect x="10.25" y="7" width="3.5" height="11" rx="1" fill="currentColor" />
            <rect x="15.5" y="4" width="3.5" height="14" rx="1" fill="currentColor" />
        </svg>
    )
}

function InvoiceHistoryIcon() {
    return (
        <svg
            aria-hidden="true"
            className="rims-menu-svg-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V6A1.5 1.5 0 0 1 7 4.5Z" />
            <path d="M9 8.5h6" />
            <path d="M9 12h6" />
            <path d="M9 15.5h4" />
        </svg>
    )
}

function getMenuIcon(label: string, path: string) {
    if (label === 'Statistics') return <StatisticsIcon />
    if (label === 'Invoice History') return <InvoiceHistoryIcon />
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
                            {getMenuIcon(item.label, item.path)}
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
