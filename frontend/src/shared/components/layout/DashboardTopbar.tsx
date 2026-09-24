import {LogOut, Menu} from 'lucide-react'
import {useActor} from '@/app/providers/ActorContext'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {RoleType} from '@/shared/types/auth'

type DashboardTopbarProps = {
    onLogout: () => void
    /** Mở ngăn kéo menu. Chỉ hiện dưới 60rem, trên đó thanh bên luôn ở đó. */
    onOpenMenu: () => void
}

export function DashboardTopbar({onLogout, onOpenMenu}: DashboardTopbarProps) {
    const {actor} = useActor()
    const {profile} = useRestaurant()
    const isCustomer = actor === RoleType.CUSTOMER

    /*
     * Tên nhà hàng đọc từ hồ sơ trong CSDL, không gõ cứng.
     *
     * Dòng này từng là chuỗi "MÃN VỊ LÂU" viết thẳng trong mã, trong khi thanh
     * bên ngay cạnh đó lại đọc tên thật từ hồ sơ — nên cùng một màn hiện hai tên
     * nhà hàng khác nhau. Đây đúng là việc mà bảng restaurant_profile sinh ra để
     * bỏ.
     */
    const restaurantName = (profile?.name ?? 'Nhà hàng').toUpperCase()

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
                            {restaurantName}
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

                        {/* Tên quán, không phải khẩu hiệu của phần mềm. Hai dòng cũ
                            — "Hệ thống quản lý nhà hàng" và câu mô tả bên dưới — lặp lại
                            ở mọi màn và không nói gì về việc đang làm. */}
                        <h1>{profile?.name ?? ''}</h1>

                        {profile?.tagline && <p>{profile.tagline}</p>}
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
