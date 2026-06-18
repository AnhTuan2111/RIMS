
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/common/Sidebar'
import { ACTOR_LABELS } from '../config/actorMenus'
import type { ActorRole } from '../config/actorMenus'
import { useActor } from '../context/ActorContext'

function getActorIcon(actor: ActorRole) {
    switch (actor) {
        case 'CHEF':
            return '👨‍🍳'
        case 'WAITER':
            return '🍽️'
        case 'CASHIER':
            return '💳'
        case 'ADMIN':
        default:
            return '🛡️'
    }
}

function getActorHomePath(actor: ActorRole) {
    switch (actor) {
        case 'CHEF':
            return '/chef/dashboard'
        case 'WAITER':
            return '/waiter/tables'
        case 'CASHIER':
            return '/cashier/payments'
        case 'ADMIN':
        default:
            return '/dashboard'
    }
}

export default function DashboardLayout() {
    const { actor, setActor } = useActor()
    const navigate = useNavigate()

    function handleChangeActor(nextActor: ActorRole) {
        setActor(nextActor)
        localStorage.setItem('selectedActor', nextActor)
        navigate(getActorHomePath(nextActor))
    }

    return (
        <div className="app-layout">
            <Sidebar />

            <div className="app-main">
                <header className="rims-topbar">
                    <div className="rims-topbar-heading">
                        <span className="rims-topbar-eyebrow">
                            <span className="rims-topbar-live-dot" />
                            RIMS CONTROL CENTER
                        </span>

                        <h1>Restaurant Management System</h1>

                        <p>
                            Theo dõi và điều phối hoạt động nhà hàng theo thời
                            gian thực.
                        </p>
                    </div>

                    <div className="rims-topbar-actions">
                        <div className="rims-current-role">
                            <span className="rims-current-role-icon">
                                {getActorIcon(actor)}
                            </span>

                            <div>
                                <small>Vai trò hiện tại</small>
                                <strong>{ACTOR_LABELS[actor]}</strong>
                            </div>
                        </div>

                        <label className="rims-actor-switcher">
                            <span>Chuyển vai trò</span>

                            <select
                                value={actor}
                                onChange={(event) =>
                                    handleChangeActor(
                                        event.target.value as ActorRole,
                                    )
                                }
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="CHEF">Chef</option>
                                <option value="WAITER">Waiter</option>
                                <option value="CASHIER">Cashier</option>
                            </select>
                        </label>
                    </div>
                </header>

                <main className="app-content rims-app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}