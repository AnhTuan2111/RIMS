import {Outlet, useNavigate} from 'react-router-dom'
import {useAuth} from '@/app/providers/AuthContext'
import {Sidebar} from '@/shared/components/layout/Sidebar'
import {DashboardTopbar} from './DashboardTopbar'

export default function DashboardLayout() {
    const navigate = useNavigate()
    const {logout} = useAuth()

    async function handleLogout() {
        await logout()
        navigate('/login', {replace: true})
    }

    return (
        <div className="rk-shell">
            <Sidebar />
            <div className="rk-shell__main">
                <DashboardTopbar onLogout={handleLogout} />
                <main className="rk-shell__content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
