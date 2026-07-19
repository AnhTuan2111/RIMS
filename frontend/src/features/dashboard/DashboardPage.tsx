import {Link} from 'react-router-dom'
import {ROLE_LABELS, roleMenus} from '@/app/config/roleMenus'
import AdminRevenueOverviewDashboard from '../admin/components/RevenueOverviewPanel'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'

export function DashboardPage() {
    const {actor} = useActor()
    const menus = roleMenus[actor]

    if (actor === RoleType.ADMIN) {
        return (
            <div className="rims-statistics-container">
                <AdminRevenueOverviewDashboard/>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <section className="page-card">
                <h2>Tổng quan hệ thống</h2>
                <p className="dashboard-role-message">
                    Chào mừng đến với RIMS — Hệ thống quản lý nhà hàng.
                    Sử dụng thanh điều hướng bên trái để truy cập các chức năng của bạn.
                </p>
            </section>

            <section className="page-card">
                <h2>Chức năng của {ROLE_LABELS[actor]}</h2>
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
