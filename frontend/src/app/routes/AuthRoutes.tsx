import {Route} from 'react-router-dom'

import LoginPage from '../../pages/login/LoginPage'
import ForgotPasswordPage from '../../pages/login/ForgotPasswordPage'
import RegisterPage from '../../pages/login/RegisterPage'

export function renderAuthRoutes() {
    return (
        <>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
        </>
    )
}