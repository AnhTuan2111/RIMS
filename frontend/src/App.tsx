import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'

import {ActorProvider} from './context/ActorContext'

import HomePage from './pages/home/HomePage'
import LoginPage from './pages/login/LoginPage'
import ForgotPasswordPage from './pages/login/ForgotPasswordPage'
import RegisterPage from './pages/login/RegisterPage'



import DashboardLayout from './pages/DashboardLayout'
import {DashboardPage} from './pages/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'

import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminTablesPage from './pages/admin/AdminTablesPage'
import AdminDishesPage from './pages/admin/AdminDishesPage'
import AdminPaymentHistoryPage from './pages/admin/AdminPaymentHistoryPage'
import AdminPaymentDetailPage from './pages/admin/AdminPaymentDetailPage'
import AdminStatisticsPage from './pages/admin/AdminStatisticsPage'
import AdminMenuDashboardPage from './pages/admin/AdminMenuDashboardPage';
import AdminCategoryPage from './pages/admin/AdminCategoryPage'

import KitchenQueuePage from './pages/chef/KitchenQueuePage'
import DishListPage from './pages/chef/DishListPage'

import ChefDashboardPage from "./pages/chef/ChefDashboardPage.tsx"
import CompletedOrdersPage from './pages/chef/CompletedOrdersPage'

import CashierPaymentsPage from './pages/cashier/CashierPaymentsPage'
import CashierInvoicesPage from './pages/cashier/CashierInvoicesPage'
import PaymentSuccess from './pages/cashier/PaymentSuccess'
import PaymentFailed from './pages/cashier/PaymentFailed'

import WaiterTableListPage from './pages/waiter/WaiterTableListPage'
import WaiterCreateOrderPage from './pages/waiter/WaiterCreateOrderPage'
import WaiterOrderDetailPage from './pages/waiter/WaiterOrderDetailPage'
import WaiterUpdateOrderPage from './pages/waiter/WaiterUpdateOrderPage'
import WaiterReservationDetailPage from './pages/waiter/WaiterReservationDetailPage'
import WaiterCreateReservationPage from './pages/waiter/WaiterCreateReservationPage'
import WaiterEditReservationPage from './pages/waiter/WaiterEditReservationPage'

function App() {
    return (
        <BrowserRouter>
            <ActorProvider>
                <Routes>
                    {/* Homepage chung */}
                    <Route path="/" element={<HomePage/>}/>

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/payment-success" element={<PaymentSuccess/>}/>
                    <Route path="/payment-failed" element={<PaymentFailed/>}/>

                    {/* Khu vực sau đăng nhập */}
                    <Route element={<DashboardLayout/>}>
                        <Route path="/dashboard" element={<DashboardPage/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>

                        {/* ADMIN */}
                        <Route path="/admin/users" element={<AdminUsersPage/>}/>
                        <Route path="/admin/tables" element={<AdminTablesPage/>}/>
                        <Route path="/admin/dishes" element={<AdminDishesPage/>}/>
                        <Route path="/admin/statistics" element={<AdminStatisticsPage/>}/>
                        <Route path="/admin/invoices" element={<AdminPaymentHistoryPage/>}/>
                        <Route path="/admin/invoices/:invoiceId" element={<AdminPaymentDetailPage/>}/>
                        <Route path="/admin/menu" element={<AdminMenuDashboardPage/>}/>
                        <Route path="/admin/categories" element={<AdminCategoryPage/>}/>

                        {/* CHEF */}
                        <Route path="/chef/dashboard" element={<ChefDashboardPage/>}/>
                        <Route path="/chef/orders" element={<KitchenQueuePage/>}/>
                        <Route path="/chef/dishes" element={<DishListPage/>}/>
                        <Route path="/chef/completed-orders" element={<CompletedOrdersPage/>}/>

                        {/* WAITER */}
                        <Route path="/waiter/tables" element={<WaiterTableListPage/>}/>
                        <Route path="/waiter/tables/:tableId/order/new" element={<WaiterCreateOrderPage/>}/>
                        <Route path="/waiter/tables/:tableId/order/detail" element={<WaiterOrderDetailPage/>}/>
                        <Route path="/waiter/tables/:tableId/order/edit" element={<WaiterUpdateOrderPage/>}/>
                        <Route path="/waiter/tables/:tableId/reservation" element={<WaiterReservationDetailPage/>}/>
                        <Route path="/waiter/reservations" element={<WaiterCreateReservationPage/>}/>
                        <Route path="/waiter/reservations/:resId/edit" element={<WaiterEditReservationPage/>}/>

                        {/* CASHIER */}
                        <Route path="/cashier/payments" element={<CashierPaymentsPage/>}/>
                        <Route path="/cashier/invoices" element={<CashierInvoicesPage/>}/>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </ActorProvider>
        </BrowserRouter>
    )
}

export default App