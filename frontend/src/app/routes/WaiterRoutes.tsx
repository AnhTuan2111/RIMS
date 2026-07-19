import {Route} from 'react-router-dom'

import WaiterTableListPage from '../../pages/waiter/WaiterTableListPage'
import WaiterCreateOrderPage from '../../pages/waiter/WaiterCreateOrderPage'
import WaiterOrderDetailPage from '../../pages/waiter/WaiterOrderDetailPage'
import WaiterUpdateOrderPage from '../../pages/waiter/WaiterUpdateOrderPage'
import WaiterReservationDetailPage from '../../pages/waiter/WaiterReservationDetailPage'
import WaiterCreateReservationPage from '../../pages/waiter/WaiterCreateReservationPage'
import WaiterEditReservationPage from '../../pages/waiter/WaiterEditReservationPage'

export function renderWaiterRoutes() {
    return (
        <>
            <Route path="/waiter/tables" element={<WaiterTableListPage/>}/>
            <Route path="/waiter/tables/:tableId/order/new" element={<WaiterCreateOrderPage/>}/>
            <Route path="/waiter/tables/:tableId/order/detail" element={<WaiterOrderDetailPage/>}/>
            <Route path="/waiter/tables/:tableId/order/edit" element={<WaiterUpdateOrderPage/>}/>
            <Route path="/waiter/tables/:tableId/reservation" element={<WaiterReservationDetailPage/>}/>
            <Route path="/waiter/reservations" element={<WaiterCreateReservationPage/>}/>
            <Route path="/waiter/reservations/:resId/edit" element={<WaiterEditReservationPage/>}/>
        </>
    )
}