// import { LoginPage } from './pages/login/LoginPage'
//
// function App() {
//     return (
//         <main>
//             <LoginPage />
//         </main>
//     )
// }
//
// export default App

//13-6-26-Clone dashboard
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/admin/DashboardPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import RevenueReportPage from "./pages/admin/RevenueReportPage";
import BestSellingPage from "./pages/admin/BestSellingPage";
import RevenueComparisonPage from "./pages/admin/RevenueComparisonPage";
import InvoiceHistoryPage from "./pages/admin/InvoiceHistoryPage";
import InvoiceDetailPage from "./pages/admin/InvoiceDetailPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route
                    path="/statistics/revenue"
                    element={<RevenueReportPage />}
                />

                <Route
                    path="/statistics/revenue-comparison"
                    element={<RevenueComparisonPage />}
                />

                <Route
                    path="/statistics/best-selling"
                    element={<BestSellingPage />}
                />

                <Route
                    path="/statistics/invoice-history"
                    element={<InvoiceHistoryPage />}
                />

                <Route
                    path="/admin/invoices/:invoiceId"
                    element={<InvoiceDetailPage />}
                />


            </Routes>
        </BrowserRouter>
    );
}

export default App;