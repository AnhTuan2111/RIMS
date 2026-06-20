import {Outlet, useNavigate} from 'react-router-dom'
import {Sidebar} from '../components/common/Sidebar'
import {ROLE_LABELS} from '../config/roleMenus'
import {RoleType} from '../types/auth'
import {useActor} from '../context/ActorContext'

function getActorIcon(actor: RoleType) {
    switch (actor) {
        case RoleType.CHEF:
            return '👨‍🍳'
        case RoleType.WAITER:
            return '🍽️'
        case RoleType.CASHIER:
            return '💳'
        case RoleType.ADMIN:
        default:
            return '🛡️'
    }
}

function getActorHomePath(actor: RoleType) {
    switch (actor) {
        case RoleType.CHEF:
            return '/chef/dashboard'
        case RoleType.WAITER:
            return '/waiter/tables'
        case RoleType.CASHIER:
            return '/cashier/payments'
        case RoleType.ADMIN:
        default:
            return '/dashboard'
    }
}

export default function DashboardLayout() {
    const {actor, setActor} = useActor()
    const navigate = useNavigate()

    function handleChangeActor(nextActor: RoleType) {
        setActor(nextActor)
        localStorage.setItem('selectedActor', nextActor)
        navigate(getActorHomePath(nextActor))
    }

    return (
        <div className="app-layout">
            <Sidebar/>

            <div className="app-main">
                <header className="rims-topbar">
                    <div className="rims-topbar-heading">
                        <span className="rims-topbar-eyebrow">
                            <span className="rims-topbar-live-dot"/>
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
                                <strong>{ROLE_LABELS[actor]}</strong>
                            </div>
                        </div>

                        <label className="rims-actor-switcher">
                            <span>Chuyển vai trò</span>

                            <select
                                value={actor}
                                onChange={(event) =>
                                    handleChangeActor(
                                        event.target.value as RoleType,
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
                    <Outlet/>
                </main>
            </div>
        </div>
    )
}