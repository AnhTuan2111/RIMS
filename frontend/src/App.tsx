import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ActorProvider } from './context/ActorContext'

import HomePage from './pages/home/HomePage'
import LoginPage from './pages/login/LoginPage'

import DashboardLayout from './pages/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'

import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminTablesPage from './pages/admin/AdminTablesPage'
import AdminDishesPage from './pages/admin/AdminDishesPage'

import KitchenQueuePage from './pages/chef/KitchenQueuePage'
import DishListPage from './pages/chef/DishListPage'

import WaiterTablesPage from './pages/waiter/WaiterTablesPage'
import WaiterCreateOrderPage from './pages/waiter/WaiterCreateOrderPage'
import WaiterOrdersPage from './pages/waiter/WaiterOrdersPage'

import CashierPaymentsPage from './pages/cashier/CashierPaymentsPage'
import CashierInvoicesPage from './pages/cashier/CashierInvoicesPage'

function App() {
    return (
        <BrowserRouter>
            <ActorProvider>
                <Routes>
                    {/* Homepage chung */}
                    <Route path="/" element={<HomePage />} />

                    {/* Login */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Khu vực sau đăng nhập */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />

                        {/* ADMIN */}
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/tables" element={<AdminTablesPage />} />
                        <Route path="/admin/dishes" element={<AdminDishesPage />} />

                        {/* CHEF */}
                        <Route path="/chef/orders" element={<KitchenQueuePage />} />
                        <Route path="/chef/dishes" element={<DishListPage />} />

                        {/* WAITER */}
                        <Route path="/waiter/tables" element={<WaiterTablesPage />} />
                        <Route path="/waiter/orders/new" element={<WaiterCreateOrderPage />} />
                        <Route path="/waiter/orders" element={<WaiterOrdersPage />} />

                        {/* CASHIER */}
                        <Route path="/cashier/payments" element={<CashierPaymentsPage />} />
                        <Route path="/cashier/invoices" element={<CashierInvoicesPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ActorProvider>
        </BrowserRouter>
    )
}

export default App