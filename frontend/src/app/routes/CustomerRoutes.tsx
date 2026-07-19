import {Route} from 'react-router-dom'

import CustomerReservations from '../../pages/customer/CustomerReservations'

export function renderCustomerRoutes() {
    return (
        <>
            <Route path="/customer/reservations" element={<CustomerReservations/>}/>
        </>
    )
}