import {useLocation} from 'react-router-dom'

import {matchMenu} from '@/app/config/roleMenus'
import {useActor} from '@/app/providers/ActorContext'
import {useTheme} from '@/app/providers/useTheme'
import {Icon} from '@/shared/components/ui/Icon'
import {useShiftClock} from '@/shared/hooks/useShiftClock'

type DashboardTopbarProps = {
    onLogout: () => void
    /** Mở ngăn kéo rail. Chỉ hiện dưới 60rem, trên đó rail luôn ở đó. */
    onOpenMenu: () => void
}

/**
 * Hàng đầu vùng nội dung: breadcrumb, đồng hồ kèm ca làm, đổi sáng tối, đăng xuất.
 *
 * <p>Bản cũ là một khối tiêu đề lớn lặp lại ở mọi màn: "TRUNG TÂM ĐIỀU HÀNH
 * RIMS", tên quán, khẩu hiệu. Ba dòng đó giống hệt nhau trên cả 30 màn nên
 * không nói gì về việc đang làm, mà lại ăn mất chiều cao ở mọi màn.
 *
 * <p>Nay là một hàng: breadcrumb nói đang ở đâu, đồng hồ nói đang ca nào.
 * KHÔNG hiện tên người dùng — nó không giúp gì cho việc đang làm, và người dùng
 * đã biết mình là ai.
 */
export function DashboardTopbar({onLogout, onOpenMenu}: DashboardTopbarProps) {
    const {actor} = useActor()
    const location = useLocation()
    const {entry, item} = matchMenu(actor, location.pathname)
    const clock = useShiftClock()
    const {preference, setPreference, resolved} = useTheme()

    return (
        <header className="rk-top">
            <button
                type="button"
                className="rk-top__menubtn"
                aria-label="Mở menu điều hướng"
                onClick={onOpenMenu}
            >
                <Icon name="menu" className="rk-icon" />
            </button>

            {/* Cấp cha CHỈ hiện khi ô rail là một nhóm có mục con. Bốn vai kia
                để phẳng nên cha và con là cùng một nhãn — bản đầu in cả hai và
                Bếp đọc ra "CẦN CHẾ BIẾN CẦN CHẾ BIẾN". */}
            <nav className="rk-crumb" aria-label="Đường dẫn">
                {entry && item && (
                    <>
                        <span className="rk-crumb__up">{entry.label}</span>
                        <span className="rk-crumb__sep">/</span>
                    </>
                )}
                <b>{item?.label ?? entry?.label ?? ''}</b>
            </nav>

            <div className="rk-top__right">
                <span className="rk-clock" title={clock.label}>
                    <Icon name={clock.icon} className="rk-icon" />
                    <span className="rk-clock__shift">{clock.label}</span>
                    <span className="rk-clock__time">{clock.time}</span>
                </span>

                <button
                    type="button"
                    className="rk-iconbtn"
                    // Ba trạng thái quay vòng: theo máy -> sáng -> tối -> theo máy.
                    // Một nút thay cho ba, vì hàng này phải sống được ở 375px.
                    aria-label={
                        preference === 'auto'
                            ? 'Chế độ theo máy, bấm để chuyển sang sáng'
                            : preference === 'light'
                              ? 'Chế độ sáng, bấm để chuyển sang tối'
                              : 'Chế độ tối, bấm để theo máy'
                    }
                    onClick={() =>
                        setPreference(
                            preference === 'auto'
                                ? 'light'
                                : preference === 'light'
                                  ? 'dark'
                                  : 'auto',
                        )
                    }
                >
                    <Icon
                        name={preference === 'auto' ? 'contrast' : resolved === 'dark' ? 'moon' : 'sun'}
                        className="rk-icon"
                    />
                </button>

                <button
                    id="btn-logout"
                    type="button"
                    className="rk-btn rk-btn--quiet rk-btn--sm"
                    onClick={onLogout}
                >
                    <Icon name="logout" className="rk-icon" />
                    <span className="rk-top__logoutlabel">Đăng xuất</span>
                </button>
            </div>
        </header>
    )
}
