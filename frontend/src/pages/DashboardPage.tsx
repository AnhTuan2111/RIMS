import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RoleType } from '../types/auth'

const ROLE_LABELS: Record<string, string> = {
    [RoleType.ADMIN]: 'Quản trị viên',
    [RoleType.CHEF]: 'Đầu bếp',
    [RoleType.WAITER]: 'Phục vụ',
    [RoleType.CASHIER]: 'Thu ngân',
}

export function DashboardPage() {
    const { user, logout, isLoading } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/', { replace: true })
    }

    if (!user) {
        return null
    }

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <div>
                    <h1>Xin chào, {user.fullName}</h1>
                    <p>
                        Vai trò: {ROLE_LABELS[user.role] ?? user.role} · {user.username}
                    </p>
                </div>
                <div className="dashboard-actions">
                    <Link className="dashboard-home-link" to="/">
                        Trang chủ
                    </Link>
                    <button className="dashboard-logout" onClick={() => void handleLogout()} disabled={isLoading}>
                        Đăng xuất
                    </button>
                </div>
            </header>

            <section className="dashboard-card">
                <h2>Thông tin tài khoản</h2>
                <dl className="dashboard-info">
                    <div>
                        <dt>Email</dt>
                        <dd>{user.email ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Số điện thoại</dt>
                        <dd>{user.phone}</dd>
                    </div>
                    <div>
                        <dt>User ID</dt>
                        <dd>{user.userId}</dd>
                    </div>
                </dl>
            </section>

            <section className="dashboard-card">
                <h2>Khu vực làm việc</h2>
                <p className="dashboard-role-message">{getRoleMessage(user.role)}</p>
            </section>
        </div>
    )
}

function getRoleMessage(role: string): string {
    switch (role) {
        case RoleType.ADMIN:
            return 'Bạn có quyền truy cập các chức năng quản trị hệ thống.'
        case RoleType.CHEF:
            return 'Bạn có quyền truy cập khu vực bếp và quản lý món ăn.'
        case RoleType.WAITER:
            return 'Bạn có quyền truy cập khu vực phục vụ và quản lý bàn.'
        case RoleType.CASHIER:
            return 'Bạn có quyền truy cập khu vực thu ngân và thanh toán.'
        default:
            return 'Chào mừng bạn đến với hệ thống RIMS.'
    }
}
