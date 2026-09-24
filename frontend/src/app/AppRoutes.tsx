import {Navigate, Route, Routes} from 'react-router-dom'

import DashboardLayout from '@/shared/components/layout/DashboardLayout'
import ProfilePage from '@/features/profile/ProfilePage'
import {RoleType} from '@/shared/types/auth'

import {ProtectedRoute} from './routes/ProtectedRoute'
import {renderPublicRoutes} from './routes/PublicRoutes.tsx'
import {renderAuthRoutes} from './routes/AuthRoutes.tsx'
import {renderAdminRoutes} from './routes/AdminRoutes.tsx'
import {renderChefRoutes} from './routes/ChefRoutes.tsx'
import {renderWaiterRoutes} from './routes/WaiterRoutes.tsx'
import {renderCashierRoutes, renderPaymentResultRoutes} from './routes/CashierRoutes.tsx'
import {renderCustomerRoutes} from './routes/CustomerRoutes.tsx'

/**
 * Bảng đường dẫn.
 *
 * <p>Các màn bên trong nằm dưới hai lớp: {@code ProtectedRoute} không kèm vai
 * trò để bắt buộc đăng nhập, rồi mỗi nhóm có thêm một lớp giới hạn vai trò. Nếu
 * không, gõ tay {@code /admin/users} là ai cũng mở được khung Quản trị — dữ liệu
 * thì backend chặn, nhưng người xem chỉ thấy một màn hỏng.
 */
function AppRoutes() {
    return (
        <Routes>
            {renderPublicRoutes()}
            {renderAuthRoutes()}

            {/* VNPay chuyển hướng khách về đây kèm kết quả trên URL. Phiên đăng
                nhập có thể đã mất trong lúc khách ở bên cổng thanh toán, nên
                không chặn. */}
            {renderPaymentResultRoutes()}

            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    {/* Hồ sơ cá nhân: vai trò nào cũng có. */}
                    <Route path="/profile" element={<ProfilePage />} />

                    <Route element={<ProtectedRoute allow={[RoleType.ADMIN]} />}>
                        {renderAdminRoutes()}
                    </Route>

                    <Route element={<ProtectedRoute allow={[RoleType.CHEF]} />}>
                        {renderChefRoutes()}
                    </Route>

                    <Route element={<ProtectedRoute allow={[RoleType.WAITER]} />}>
                        {renderWaiterRoutes()}
                    </Route>

                    <Route element={<ProtectedRoute allow={[RoleType.CASHIER]} />}>
                        {renderCashierRoutes()}
                    </Route>

                    <Route element={<ProtectedRoute allow={[RoleType.CUSTOMER]} />}>
                        {renderCustomerRoutes()}
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default AppRoutes
