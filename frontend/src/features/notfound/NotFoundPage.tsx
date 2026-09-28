import {Link, useLocation} from 'react-router-dom'

import {useAuth} from '@/app/providers/AuthContext'
import {getHomePathForRole} from '@/app/routes/homePath'

/**
 * Trang cho đường dẫn không tồn tại.
 *
 * <p>Trước đây mọi đường dẫn lạ lặng lẽ chuyển về trang chủ. Người theo một
 * đường dẫn cũ — dấu trang, một tin nhắn, một màn đã đổi chỗ — thấy mình đứng ở
 * trang chủ mà không biết vì sao, và thường gõ lại đúng đường dẫn đó.
 *
 * <p>Đã đăng nhập thì nút chính đưa về màn làm việc của vai đó, không phải
 * trang chủ công khai: phục vụ đang trong ca không cần thực đơn quảng cáo.
 */
export default function NotFoundPage() {
    const {pathname} = useLocation()
    const {isAuthenticated, user} = useAuth()

    const workHome = isAuthenticated && user ? getHomePathForRole(user.role) : null

    return (
        <main className="rk-notfound">
            <div className="rk-card rk-card--pad rk-notfound__card">
                {/* Số kiểu bảng tỉ số — một trong sáu thiết bị retro đã chốt. */}
                <div className="rk-score rk-notfound__code" aria-hidden="true">
                    <span className="rk-score__d">4</span>
                    <span className="rk-score__d">0</span>
                    <span className="rk-score__d">4</span>
                </div>

                <h1 className="rk-notfound__title">Không có trang này</h1>

                <p className="rk-notfound__text">
                    Đường dẫn <code>{pathname}</code> không tồn tại hoặc đã đổi chỗ.
                </p>

                <div className="rk-actions">
                    {workHome && (
                        <Link className="rk-btn rk-btn--primary" to={workHome}>
                            Về màn làm việc
                        </Link>
                    )}

                    <Link
                        className={
                            workHome ? 'rk-btn rk-btn--quiet' : 'rk-btn rk-btn--primary'
                        }
                        to="/"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </main>
    )
}
