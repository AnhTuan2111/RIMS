import {Route} from 'react-router-dom'

import AdminUsersPage from '../../features/admin/AdminUsersPage'
import AdminTablesPage from '../../features/admin/AdminTablesPage'
import AdminDishesPage from '../../features/admin/AdminDishesPage'
import AdminPaymentHistoryPage from '../../features/admin/AdminPaymentHistoryPage'
import AdminPaymentDetailPage from '../../features/admin/AdminPaymentDetailPage'
import AdminStatisticsPage from '../../features/admin/AdminStatisticsPage'
import AdminMenuDashboardPage from '../../features/admin/AdminMenuDashboardPage'
import AdminCategoryPage from '../../features/admin/AdminCategoryPage'

export function renderAdminRoutes() {
    return (
        <>
            <Route path="/admin/users" element={<AdminUsersPage/>}/>
            <Route path="/admin/tables" element={<AdminTablesPage/>}/>
            <Route path="/admin/dishes" element={<AdminDishesPage/>}/>
            <Route path="/admin/statistics" element={<AdminStatisticsPage/>}/>
            <Route path="/admin/invoices" element={<AdminPaymentHistoryPage/>}/>
            <Route path="/admin/invoices/:invoiceId" element={<AdminPaymentDetailPage/>}/>
            <Route path="/admin/menu" element={<AdminMenuDashboardPage/>}/>
            <Route path="/admin/categories" element={<AdminCategoryPage/>}/>
        </>
    )
}