import {Route} from 'react-router-dom'

import CashierPaymentsPage from '../../pages/cashier/CashierPaymentsPage'
import CashierInvoicesPage from '../../pages/cashier/CashierInvoicesPage'
import PaymentSuccess from '../../pages/cashier/PaymentSuccess'
import PaymentFailed from '../../pages/cashier/PaymentFailed'

export function renderCashierRoutes() {
    return (
        <>
            <Route path="/cashier/payments" element={<CashierPaymentsPage/>}/>
            <Route path="/cashier/invoices" element={<CashierInvoicesPage/>}/>
        </>
    )
}

export function renderPaymentResultRoutes() {
    return (
        <>
            <Route path="/payment-success" element={<PaymentSuccess/>}/>
            <Route path="/payment-failed" element={<PaymentFailed/>}/>
        </>
    )
}