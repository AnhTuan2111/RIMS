import {
    Outlet,
    useNavigate,
} from 'react-router-dom'

import {Sidebar} from '../components/common/Sidebar'
import {ROLE_LABELS} from '../config/roleMenus'
import {useActor} from '../context/ActorContext'
import {RoleType} from '../types/auth'

const actorOptions: RoleType[] = [
    RoleType.ADMIN,
    RoleType.CHEF,
    RoleType.WAITER,
    RoleType.CASHIER,
    RoleType.CUSTOMER,
]

function getDefaultPathByActor(actor: RoleType) {
    switch (actor) {
        case RoleType.ADMIN:
            return '/dashboard'

        case RoleType.CHEF:
            return '/chef/dashboard'

        case RoleType.WAITER:
            return '/waiter/tables'

        case RoleType.CASHIER:
            return '/cashier/payments'

        case RoleType.CUSTOMER:
            return '/customer/reservations'

        default:
            return '/dashboard'
    }
}

export default function DashboardLayout() {
    const {actor, setActor} =
        useActor()

    const navigate =
        useNavigate()

    function handleChangeActor(nextActor: RoleType) {
        setActor(nextActor)

        navigate(
            getDefaultPathByActor(nextActor),
            {
                replace: true,
            },
        )
    }

    return (
        <div className="app-layout d-flex min-vh-100 bg-light">
            <Sidebar />

            <div className="app-main flex-grow-1 min-vw-0 d-flex flex-column">
                <header className="app-topbar navbar navbar-expand-lg bg-white border-bottom shadow-sm px-3 px-lg-4 py-3 sticky-top">
                    <div className="container-fluid px-0 gap-3">
                        <div className="d-flex flex-column">
                            <h1 className="h4 fw-bold mb-1 text-dark">
                                Restaurant Management System
                            </h1>

                            <p className="mb-0 text-secondary small">
                                Giao diện quản lý dùng chung cho tất cả vai trò.
                            </p>
                        </div>

                        <div className="topbar-actions ms-lg-auto d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
                            <span className="badge text-bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                                Đang xem: {ROLE_LABELS[actor]}
                            </span>

                            <label className="visually-hidden" htmlFor="actor-select">
                                Chọn vai trò
                            </label>

                            <select
                                id="actor-select"
                                className="form-select form-select-sm w-auto"
                                value={actor}
                                onChange={(event) =>
                                    handleChangeActor(
                                        event.target.value as RoleType,
                                    )
                                }
                            >
                                {actorOptions.map((option) => (
                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        {ROLE_LABELS[option]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                <main className="app-content rims-app-content flex-grow-1 p-3 p-lg-4">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}