import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/login/LoginPage'

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <main className="app-loading">
                <p>Đang tải...</p>
            </main>
        )
    }

    return <main>{isAuthenticated ? <DashboardPage /> : <LoginPage />}</main>
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App
