import {
    Ban,
    BookOpen,
    CalendarClock,
    ChartColumn,
    CheckCheck,
    CircleUser,
    Dot,
    Flame,
    FolderTree,
    Grid2x2,
    Layers,
    LayoutGrid,
    ReceiptText,
    Sparkles,
    Store,
    Users,
    Utensils,
    Wallet,
} from 'lucide-react'

import {Fragment} from 'react'
import {NavLink} from 'react-router-dom'
import {ROLE_LABELS, roleMenus} from '@/app/config/roleMenus'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {ThemeToggle} from '@/shared/components/ui'

/**
 * Icon cho từng mục menu.
 *
 * <p>Trước đây hàm này trả về ký tự Unicode nhặt ngẫu nhiên (▦ ⌁ ◉ ▤ ◷ ₫ ▧ ❏ 🞖 🛈 ♙)
 * cộng một SVG vẽ tay — mỗi icon một nét vẽ, một cỡ, và hiển thị khác nhau trên từng
 * hệ điều hành. Nay dùng chung một bộ lucide.
 */
function MenuIcon({path}: {path: string}) {
    const props = {className: 'rk-icon', 'aria-hidden': true} as const

    if (path.includes('restaurant')) return <Store {...props} />
    if (path.includes('dashboard')) return <LayoutGrid {...props} />
    if (path.includes('completed')) return <CheckCheck {...props} />
    if (path.includes('cancelled')) return <Ban {...props} />
    if (path.includes('grouped')) return <Layers {...props} />
    if (path.includes('orders')) return <Flame {...props} />
    if (path.includes('dishes')) return <Utensils {...props} />
    if (path.includes('tables')) return <Grid2x2 {...props} />
    if (path.includes('reservations')) return <CalendarClock {...props} />
    if (path.includes('payments')) return <Wallet {...props} />
    if (path.includes('invoices')) return <ReceiptText {...props} />
    if (path.includes('menu')) return <BookOpen {...props} />
    if (path.includes('categories')) return <FolderTree {...props} />
    if (path.includes('statistics')) return <ChartColumn {...props} />
    if (path.includes('users')) return <Users {...props} />
    if (path.includes('profile')) return <CircleUser {...props} />

    return <Dot {...props} />
}

export function Sidebar() {
    const {actor} = useActor()
    const {profile} = useRestaurant()
    const menus = roleMenus[actor] ?? []

    // Khách hàng nhìn thấy thương hiệu nhà hàng; nhân viên nhìn thấy tên hệ thống.
    const restaurantName = profile?.name ?? 'Nhà hàng'
    const restaurantTagline = profile?.tagline ?? 'Thực đơn & đặt bàn'
    const brandInitial = restaurantName.trim().charAt(0).toUpperCase() || 'R'

    const stored = localStorage.getItem('currentUser')
    const currentUser = stored
        ? (JSON.parse(stored) as {fullName: string; username: string})
        : null

    return (
        <aside className="rk-shell__side">
            <div className="rk-shell__brand">
                <div className="rk-shell__logo">
                    {actor === RoleType.CUSTOMER ? brandInitial : 'R'}
                </div>
                <div>
                    <h2>{actor === RoleType.CUSTOMER ? restaurantName : 'RIMS'}</h2>
                    <p>
                        {actor === RoleType.CUSTOMER
                            ? restaurantTagline
                            : 'Vận hành nhà hàng'}
                    </p>
                </div>
            </div>

            <div className="rk-shell__role">
                <div className="rk-shell__role-icon">
                    <Sparkles className="rk-icon" aria-hidden="true" />
                </div>
                <div>
                    <small>Không gian làm việc</small>
                    <strong>{ROLE_LABELS[actor]}</strong>
                </div>
            </div>

            <nav className="rk-shell__nav">
                {menus.map((item) => (
                    <Fragment key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({isActive}) =>
                                isActive ? 'rk-shell__link active' : 'rk-shell__link'
                            }
                        >
                            <span className="rk-shell__linkicon">
                                <MenuIcon path={item.path} />
                            </span>

                            <span className="rk-shell__linklabel">{item.label}</span>

                            <span className="rk-shell__linkarrow">›</span>
                        </NavLink>

                        {item.quickLinks && item.quickLinks.length > 0 && (
                            <div className="rk-shell__nav">
                                {item.quickLinks.map((quickLink) => (
                                    <NavLink
                                        key={quickLink.path}
                                        to={quickLink.path}
                                        className={({isActive}) =>
                                            [
                                                'rk-shell__link',
                                                `quick-${quickLink.variant}`,
                                                isActive ? 'active' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')
                                        }
                                    >
                                        <span className="rk-shell__linkicon">
                                            {quickLink.icon}
                                        </span>

                                        <span className="rk-shell__linklabel">
                                            {quickLink.label}
                                        </span>

                                        <span className="rk-shell__linkarrow">›</span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </Fragment>
                ))}
            </nav>

            <ThemeToggle />

            <div className="rk-shell__user">
                <span className="rk-shell__dot" />
                <div>
                    <strong>
                        {currentUser?.fullName ?? currentUser?.username ?? 'Người dùng'}
                    </strong>
                    <small>Hệ thống hoạt động</small>
                </div>
            </div>
        </aside>
    )
}
