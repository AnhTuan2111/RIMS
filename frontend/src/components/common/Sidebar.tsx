import {
    Fragment,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react'
import {
    NavLink,
    useNavigate,
} from 'react-router-dom'

import {
    ROLE_LABELS,
    roleMenus,
} from '../../config/roleMenus'
import {logout} from '../../api/auth'
import {useActor} from '../../context/ActorContext'
import {RoleType} from '../../types/auth'

type CurrentUserPreview = {
    fullName?: string | null
    username?: string | null
}

type AdminQuickLink = {
    label: string
    path: string
    variant: 'primary' | 'success'
    icon: ReactNode
}

const roleAccent: Record<RoleType, string> = {
    [RoleType.ADMIN]: 'Quản trị hệ thống',
    [RoleType.CHEF]: 'Bếp vận hành',
    [RoleType.WAITER]: 'Phục vụ tại bàn',
    [RoleType.CASHIER]: 'Thu ngân',
    [RoleType.CUSTOMER]: 'Khách hàng',
}

const roleIcon: Record<RoleType, string> = {
    [RoleType.ADMIN]: '♛',
    [RoleType.CHEF]: '♨',
    [RoleType.WAITER]: '☕',
    [RoleType.CASHIER]: '₫',
    [RoleType.CUSTOMER]: '♡',
}

const adminQuickLinks: AdminQuickLink[] = [
    {
        label: 'Thống kê',
        path: '/admin/statistics',
        variant: 'primary',
        icon: '↗',
    },
    {
        label: 'Lịch sử hóa đơn',
        path: '/admin/invoices',
        variant: 'success',
        icon: '▧',
    },
]

function readCurrentUser(): CurrentUserPreview | null {
    if (
        typeof window === 'undefined'
        || typeof window.localStorage === 'undefined'
    ) {
        return null
    }

    try {
        const stored =
            localStorage.getItem('currentUser')

        if (!stored) {
            return null
        }

        return JSON.parse(stored) as CurrentUserPreview
    } catch {
        localStorage.removeItem('currentUser')
        return null
    }
}

function getMenuIcon(path: string): ReactNode {
    if (path.includes('dashboard')) {
        return '▦'
    }

    if (path.includes('completed')) {
        return '✓'
    }

    if (path.includes('cancelled')) {
        return '×'
    }

    if (path.includes('grouped')) {
        return '☷'
    }

    if (path.includes('orders')) {
        return '⌁'
    }

    if (path.includes('dishes')) {
        return '◉'
    }

    if (path.includes('menu')) {
        return '☰'
    }

    if (path.includes('categories')) {
        return '◫'
    }

    if (path.includes('tables')) {
        return '▤'
    }

    if (path.includes('reservations')) {
        return '◷'
    }

    if (path.includes('payments')) {
        return '₫'
    }

    if (path.includes('invoices')) {
        return '▧'
    }

    if (path.includes('users')) {
        return '♙'
    }

    if (path.includes('profile')) {
        return '◎'
    }

    return '•'
}

function getUserDisplayName(
    currentUser: CurrentUserPreview | null,
) {
    return currentUser?.fullName
        ?? currentUser?.username
        ?? 'Người dùng'
}

export function Sidebar() {
    const {actor} =
        useActor()

    const navigate =
        useNavigate()

    const menus =
        roleMenus[actor] ?? []

    const currentUser =
        useMemo(
            () => readCurrentUser(),
            [],
        )

    const handleLogout =
        useCallback(
            () => {
                logout()

                navigate(
                    '/login',
                    {
                        replace: true,
                    },
                )
            },
            [
                navigate,
            ],
        )

    return (
        <aside className="app-sidebar rims-sidebar d-flex flex-column">
            <div className="rims-sidebar-brand">
                <div className="rims-sidebar-logo">
                    R
                </div>

                <div className="min-w-0">
                    <h2 className="mb-0">
                        RIMS
                    </h2>

                    <p className="mb-0">
                        Restaurant Operations
                    </p>
                </div>
            </div>

            <div className="rims-sidebar-role">
                <div className="rims-role-icon">
                    {roleIcon[actor]}
                </div>

                <div className="min-w-0">
                    <small>
                        {roleAccent[actor]}
                    </small>

                    <strong>
                        {ROLE_LABELS[actor]}
                    </strong>
                </div>
            </div>

            <nav className="rims-sidebar-nav flex-grow-1">
                <p className="rims-sidebar-title">
                    Chức năng
                </p>

                {menus.map((item) => (
                    <Fragment key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({isActive}) =>
                                [
                                    'rims-sidebar-link',
                                    'nav-link',
                                    isActive ? 'active' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')
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
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </Fragment>
                ))}
            </nav>

            <div className="rims-sidebar-footer">
                <div className="rims-sidebar-status">
                    <span className="rims-online-dot" />

                    <div className="min-w-0">
                        <strong>
                            {getUserDisplayName(currentUser)}
                        </strong>

                        <small>
                            Hệ thống hoạt động
                        </small>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn rims-logout-button w-100"
                    onClick={handleLogout}
                >
                    <span>🚪</span>
                    Đăng xuất
                </button>
            </div>
        </aside>
    )
}