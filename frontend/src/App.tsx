import {DocumentBranding} from './app/branding/DocumentBranding'
import {AppProviders} from './app/providers/AppProviders'
import AppRoutes from './app/routes'

function App() {
    return (
        <AppProviders>
            <DocumentBranding />
            <AppRoutes />
        </AppProviders>
    )
}

export default App
