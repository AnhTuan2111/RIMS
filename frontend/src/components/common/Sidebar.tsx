import {NavLink, useNavigate} from 'react-router-dom'
import {ROLE_LABELS, roleMenus} from '../../config/roleMenus'
import {useActor} from '../../context/ActorContext'
import {logout} from '../../api/auth'


const adminQuickLinks = [
    {
        label: 'Thống kê',
        path: '/admin/statistics',
        variant: 'primary',
        icon: <StatisticsQuickIcon/>,
    },
    {
        label: 'Lịch sử hóa đơn',
        path: '/admin/invoices',
        variant: 'secondary',
        icon: <InvoiceStackIcon/>,
    },
]

function StatisticsQuickIcon() {
    return (
        <svg
            aria-hidden="true"
            className="rims-quick-svg"
            focusable="false"
            viewBox="0 0 24 24"
        >
            <path d="M4.5 18.5h14"/>
            <path d="M6.5 18.5v-6"/>
            <path d="M10.5 18.5v-9"/>
            <path d="M14.5 18.5v-4"/>
            <circle cx="16.5" cy="7.5" r="3"/>
            <path d="m19 10 2.2 2.2"/>
        </svg>
    )
}

function InvoiceStackIcon() {
    return (
        <svg
            aria-hidden="true"
            className="rims-quick-svg"
            focusable="false"
            viewBox="0 0 24 24"
        >
            <path d="M7 5h10a2 2 0 0 1 2 2v11H7z"/>
            <path d="M5 8h10a2 2 0 0 1 2 2v9H5z"/>
            <path d="M8.5 12h5.5"/>
            <path d="M8.5 15h4"/>
        </svg>
    )
}

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
    if (path.includes('profile'))
        return (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <circle
                    cx="12"
                    cy="9"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M7.5 17C8.8 14.8 15.2 14.8 16.5 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        )
    return '•'
}

export function Sidebar() {
    const {actor} = useActor()
    const navigate = useNavigate()
    const menus = roleMenus[actor] ?? []

    const stored = localStorage.getItem('currentUser')
    const currentUser = stored ? JSON.parse(stored) as { fullName: string; username: string } : null

    const handleLogout = () => {
        logout()
        navigate('/login', {replace: true})
    }

    return (
        <aside className="app-sidebar rims-sidebar">
            <div className="rims-sidebar-brand">
                <div className="rims-sidebar-logo">R</div>
                <div>
                    <h2>RIMS</h2>
                    <p>Restaurant Operations</p>
                </div>
            </div>

            <div className="rims-sidebar-role">
                <div className="rims-role-icon">✦</div>
                <div>
                    <small>Không gian làm việc</small>
                    <strong>{ROLE_LABELS[actor]}</strong>
                </div>
            </div>

            <nav className="rims-sidebar-nav">
                <p className="rims-sidebar-title">CHỨC NĂNG</p>

                {menus.map((item) => (
                    <Fragment key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({isActive}) =>
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

                        {item.path === '/admin/dishes' && (
                            <div className="rims-sidebar-quick-links">
                                {adminQuickLinks.map((quickLink) => (
                                    <NavLink
                                        key={quickLink.path}
                                        to={quickLink.path}
                                        className={({isActive}) =>
                                            [
                                                'rims-sidebar-quick-link',
                                                `quick-${quickLink.variant}`,
                                                isActive ? 'active' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')
                                        }
                                    >
                                        <span className="rims-sidebar-quick-icon">
                                            {quickLink.icon}
                                        </span>

                                        <span className="rims-sidebar-quick-label">
                                            {quickLink.label}
                                        </span>

                                        <span className="rims-sidebar-quick-arrow">
                                            ›
                                        </span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </Fragment>
                ))}
            </nav>

            <div className="rims-sidebar-status">
                <span className="rims-online-dot"/>
                <div>
                    <strong>{currentUser?.fullName ?? currentUser?.username ?? 'Người dùng'}</strong>
                    <small>Hệ thống hoạt động</small>
                </div>
            </div>

            <button
                onClick={handleLogout}
                style={{
                    margin: '8px 16px 16px',
                    padding: '10px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    width: 'calc(100% - 32px)',
                }}
            >
                🚪 Đăng xuất
            </button>
        </aside>
    )
}
