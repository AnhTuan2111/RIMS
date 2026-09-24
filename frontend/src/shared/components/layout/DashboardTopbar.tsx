import {LogOut} from 'lucide-react'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'

type DashboardTopbarProps = {
    onLogout: () => void
}

export function DashboardTopbar({onLogout}: DashboardTopbarProps) {
    const {actor} = useActor()
    const isCustomer = actor === RoleType.CUSTOMER

    const stored = localStorage.getItem('currentUser')
    const currentUser = stored
        ? (JSON.parse(stored) as {fullName: string; username: string})
        : null

    return (
        <header className="rk-shell__top">
            <div className="rk-shell__topheading">
                {isCustomer ? (
                    <>
                        <span className="rk-shell__eyebrow">
                            <span className="rk-shell__livedot" />
                            MÃN VỊ LÂU
                        </span>

                        <h1>
                            Chào mừng,{' '}
                            {currentUser?.fullName ??
                                currentUser?.username ??
                                'Quý khách'}
                        </h1>

                        <p>Quản lý đặt bàn và hồ sơ cá nhân của bạn.</p>
                    </>
                ) : (
                    <>
                        <span className="rk-shell__eyebrow">
                            <span className="rk-shell__livedot" />
                            TRUNG TÂM ĐIỀU HÀNH RIMS
                        </span>

                        <h1>Hệ thống quản lý nhà hàng</h1>

                        <p>
                            Theo dõi và điều phối hoạt động nhà hàng theo thời gian thực.
                        </p>
                    </>
                )}
            </div>

            <div className="rk-actions">
                <button
                    id="btn-logout"
                    type="button"
                    className="rk-btn rk-btn--quiet"
                    onClick={onLogout}
                >
                    <LogOut className="rk-icon" aria-hidden="true" />
                    Đăng xuất
                </button>
            </div>
        </header>
    )
}
