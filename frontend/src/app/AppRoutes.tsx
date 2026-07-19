import {Navigate, Route, Routes} from 'react-router-dom'

import DashboardLayout from '../components/layout/DashboardLayout'
import {DashboardPage} from '../pages/DashboardPage'
import ProfilePage from '../pages/profile/ProfilePage'

import {renderPublicRoutes} from './routes/PublicRoutes.tsx'
import {renderAuthRoutes} from './routes/AuthRoutes.tsx'
import {renderAdminRoutes} from './routes/AdminRoutes.tsx'
import {renderChefRoutes} from './routes/ChefRoutes.tsx'
import {renderWaiterRoutes} from './routes/WaiterRoutes.tsx'
import {
    renderCashierRoutes,
    renderPaymentResultRoutes,
} from './routes/CashierRoutes.tsx'
import {renderCustomerRoutes} from './routes/CustomerRoutes.tsx'

function AppRoutes() {
    return (
        <Routes>
            {renderPublicRoutes()}
            {renderAuthRoutes()}
            {renderPaymentResultRoutes()}

            <Route element={<DashboardLayout/>}>
                <Route path="/dashboard" element={<DashboardPage/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>

                {renderAdminRoutes()}
                {renderChefRoutes()}
                {renderWaiterRoutes()}
                {renderCashierRoutes()}
                {renderCustomerRoutes()}
            </Route>

            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    )
}

export default AppRoutes