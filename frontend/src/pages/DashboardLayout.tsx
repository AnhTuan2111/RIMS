import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/common/Sidebar'
import { ACTOR_LABELS } from '../config/actorMenus'
import type { ActorRole } from '../config/actorMenus'
import { useActor } from '../context/ActorContext'

export default function DashboardLayout() {
    const { actor, setActor } = useActor()
    const navigate = useNavigate()

    function handleChangeActor(nextActor: ActorRole) {
        setActor(nextActor)
        navigate('/dashboard')
    }

    return (
        <div className="app-layout">
            <Sidebar />

            <div className="app-main">
                <header className="app-topbar">
                    <div>
                        <h1>Restaurant Management System</h1>
                        <p>Khung frontend chung cho Admin, Chef, Waiter, Cashier</p>
                    </div>

                    <div className="topbar-actions">
                        <span className="current-role-badge">
                            Đang xem: {ACTOR_LABELS[actor]}
                        </span>

                        <select
                            className="actor-select"
                            value={actor}
                            onChange={(event) =>
                                handleChangeActor(event.target.value as ActorRole)
                            }
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="CHEF">Chef</option>
                            <option value="WAITER">Waiter</option>
                            <option value="CASHIER">Cashier</option>
                        </select>
                    </div>
                </header>

                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}