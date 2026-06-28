import {Link} from 'react-router-dom'
import {
    ROLE_LABELS,
    roleMenus,
} from '../config/roleMenus'
import AdminRevenueOverviewDashboard from '../components/admin/AdminRevenueOverviewDashboard'
import {useActor} from '../context/ActorContext'
import {RoleType} from '../types/auth'

export function DashboardPage() {
    const {actor} = useActor()
    const menus = roleMenus[actor]

    if (actor === RoleType.ADMIN) {
        return (
            <div className="rims-statistics-container">
                <AdminRevenueOverviewDashboard />
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <section className="page-card">
                <h2>Tổng quan hệ thống</h2>
                <p className="dashboard-role-message">
                    Đây là khung frontend chung cho các actor trong hệ thống quản lý nhà hàng.
                    Hiện tại mới dựng layout và điều hướng, chưa cần đăng nhập hay phân quyền.
                </p>
            </section>

            <section className="page-card actor-card">
                <div className="actor-card-header">
                    <div>
                        <h2>{ROLE_LABELS[actor]}</h2>
                        <p>Trang tổng quan cho quyền {ROLE_LABELS[actor]}</p>
                    </div>

                    <span className="current-role-badge">{actor}</span>
                </div>

                <div className="dashboard-shortcuts">
                    {menus.map((item) => (
                        <Link key={item.path} className="dashboard-home-link" to={item.path}>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
