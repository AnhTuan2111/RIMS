import {Route} from 'react-router-dom'

import ChefDashboardPage from '../../pages/chef/ChefDashboardPage'
import KitchenQueuePage from '../../pages/chef/KitchenQueuePage'
import DishListPage from '../../pages/chef/DishListPage'
import CompletedOrdersPage from '../../pages/chef/CompletedOrdersPage'
import GroupedKitchenPage from '../../pages/chef/GroupedKitchenPage'
import CancelledOrdersPage from '../../pages/chef/CancelledOrdersPage'

export function renderChefRoutes() {
    return (
        <>
            <Route path="/chef/dashboard" element={<ChefDashboardPage/>}/>
            <Route path="/chef/orders" element={<KitchenQueuePage/>}/>
            <Route path="/chef/dishes" element={<DishListPage/>}/>
            <Route path="/chef/grouped-orders" element={<GroupedKitchenPage/>}/>
            <Route path="/chef/cancelled-orders" element={<CancelledOrdersPage/>}/>
            <Route path="/chef/completed-orders" element={<CompletedOrdersPage/>}/>
        </>
    )
}