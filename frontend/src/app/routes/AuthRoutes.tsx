import {Route} from 'react-router-dom'

import LoginPage from '../../features/auth/LoginPage'
import ForgotPasswordPage from '../../features/auth/ForgotPasswordPage'
import RegisterPage from '../../features/auth/RegisterPage'
import ForceChangePasswordPage from '../../features/auth/ForceChangePasswordPage'

export function renderAuthRoutes() {
    return (
        <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Nằm ngoài ProtectedRoute: chốt chặn trong đó đá mọi tài khoản còn
                cờ về đây, đặt nó vào trong thì thành vòng lặp. Chính màn này tự
                đá khách vãng lai về trang đăng nhập. */}
            <Route path="/change-password" element={<ForceChangePasswordPage />} />
        </>
    )
}
