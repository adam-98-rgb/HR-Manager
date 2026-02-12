import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import EmployeesPage from './pages/EmployeesPage'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'

type AuthState = 'loading' | 'setup' | 'login' | 'authenticated'

function App(): JSX.Element {
    const [authState, setAuthState] = useState<AuthState>('loading')
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'people' | 'settings'>('dashboard')
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const init = async () => {
            try {
                // @ts-ignore
                const isSetup = await window.api.db.getStatus()
                setAuthState(isSetup ? 'login' : 'setup')

                // Fetch app path for icons
                // @ts-ignore
                const path = await window.api.db.getAppPath()
                // @ts-ignore
                window.appPath = path
            } catch (error) {
                console.error('Failed to initialize:', error)
                setAuthState('setup')
            }
        }
        init()
    }, [])

    const handleSetupComplete = (userData: any) => {
        setUser(userData)
        setAuthState('authenticated')
    }

    const handleLogin = (userData: any) => {
        setUser(userData)
        setAuthState('authenticated')
    }

    if (authState === 'loading') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ffcc4d] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (authState === 'setup') {
        return <SetupPage onComplete={handleSetupComplete} />
    }

    if (authState === 'login') {
        return <LoginPage onLogin={handleLogin} />
    }

    return (
        <Layout onNavigate={setCurrentPage} currentPage={currentPage} user={user}>
            {currentPage === 'dashboard' && <DashboardPage user={user} />}
            {currentPage === 'people' && <EmployeesPage />}
            {currentPage === 'settings' && <SettingsPage currentUser={user} />}
        </Layout>
    )
}

export default App
