import {LogOut, Menu} from 'lucide-react'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'

type DashboardTopbarProps = {
    onLogout: () => void
    /** Mở ngăn kéo menu. Chỉ hiện dưới 60rem, trên đó thanh bên luôn ở đó. */
    onOpenMenu: () => void
}

export function DashboardTopbar({onLogout, onOpenMenu}: DashboardTopbarProps) {
    const {actor} = useActor()
    const isCustomer = actor === RoleType.CUSTOMER

    const stored = localStorage.getItem('currentUser')
    const currentUser = stored
        ? (JSON.parse(stored) as {fullName: string; username: string})
        : null

    return (
        <header className="rk-shell__top">
            <button
                type="button"
                className="rk-shell__menubtn"
                aria-label="Mở menu điều hướng"
                onClick={onOpenMenu}
            >
                <Menu className="rk-icon" aria-hidden="true" />
            </button>

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
                    aria-label="Đăng xuất"
                    onClick={onLogout}
                >
                    <LogOut className="rk-icon" aria-hidden="true" />
                    {/* Bọc trong span để CSS ẩn được nhãn chữ trên di động mà vẫn giữ
                        biểu tượng. aria-label ở trên vẫn gọi tên đủ cho trình đọc màn hình. */}
                    <span>Đăng xuất</span>
                </button>
            </div>
        </header>
    )
}
