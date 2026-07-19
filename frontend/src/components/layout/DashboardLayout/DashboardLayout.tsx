import {Outlet, useNavigate} from 'react-router-dom'
import {logout} from '../../../api/auth'
import {Sidebar} from '../Sidebar'
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