import {Route} from 'react-router-dom'

import AdminUsersPage from '../../pages/admin/AdminUsersPage'
import AdminTablesPage from '../../pages/admin/AdminTablesPage'
import AdminDishesPage from '../../pages/admin/AdminDishesPage'
import AdminPaymentHistoryPage from '../../pages/admin/AdminPaymentHistoryPage'
import AdminPaymentDetailPage from '../../pages/admin/AdminPaymentDetailPage'
import AdminStatisticsPage from '../../pages/admin/AdminStatisticsPage'
import AdminMenuDashboardPage from '../../pages/admin/AdminMenuDashboardPage'
import AdminCategoryPage from '../../pages/admin/AdminCategoryPage'

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