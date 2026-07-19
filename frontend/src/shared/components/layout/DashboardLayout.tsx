import {Outlet, useNavigate} from 'react-router-dom'
import {logout} from '@/shared/api/auth'
import {Sidebar} from '@/shared/components/layout/Sidebar'
import {DashboardTopbar} from './DashboardTopbar'

export default function DashboardLayout() {
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login', {replace: true})
    }

    return (
        <div className="app-layout">
            <Sidebar/>

            <div className="app-main">
                <DashboardTopbar onLogout={handleLogout}/>

                <main className="app-content rims-app-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    )
}