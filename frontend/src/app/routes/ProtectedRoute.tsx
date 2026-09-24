import {Navigate, Outlet, useLocation} from 'react-router-dom'

import {useAuth} from '@/app/providers/AuthContext'
import {getHomePathForRole} from '@/app/routes/homePath'
import {LoadingState} from '@/shared/components/feedback'
import type {RoleType} from '@/shared/types/auth'

interface ProtectedRouteProps {
    /** Bỏ trống nghĩa là chỉ cần đăng nhập, vai trò nào cũng được. */
    allow?: RoleType[]
}

/**
 * Chặn cửa cho các màn bên trong.
 *
 * <p>File này đã tồn tại từ trước nhưng KHÔNG route nào dùng, nên gõ thẳng
 * {@code /admin/users} khi chưa đăng nhập vẫn hiện đầy đủ khung Quản trị: toàn
 * bộ menu, nhãn "Quản trị viên" và nút Đăng xuất. Dữ liệu thì an toàn vì backend
 * trả 401, nhưng người xem không hiểu chuyện gì đang xảy ra và menu của mọi vai
 * trò bị lộ ra.
 *
 * <p>Sidebar đọc vai trò từ ActorContext, vốn mặc định là ADMIN và lưu ở
 * localStorage — đó là lý do khách vãng lai lại thấy menu Quản trị. Chỗ này
 * dùng vai trò trong phiên đăng nhập, không dùng giá trị đó.
 *
 * <p>Đây chỉ là lớp cho đúng trải nghiệm. Quyền thật nằm ở backend.
 */
export function ProtectedRoute({allow}: ProtectedRouteProps) {
    const {isAuthenticated, isLoading, user} = useAuth()
    const location = useLocation()

    // Còn đang khôi phục phiên: chưa biết có đăng nhập hay không, đừng đá ra
    // trang đăng nhập rồi lại đá về.
    if (isLoading) {
        return (
            <LoadingState
                title="Đang kiểm tra phiên đăng nhập…"
                description="Chờ một chút để hệ thống xác nhận tài khoản."
            />
        )
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />
    }

    if (allow && !allow.includes(user.role)) {
        return <Navigate to={getHomePathForRole(user.role)} replace />
    }

    return <Outlet />
}
