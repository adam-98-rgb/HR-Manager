import Navbar from './Navbar'

interface LayoutProps {
    children: React.ReactNode
    onNavigate: (page: 'dashboard' | 'people' | 'settings') => void
    currentPage: 'dashboard' | 'people' | 'settings'
    user: any
}

export default function Layout({ children, onNavigate, currentPage, user }: LayoutProps): JSX.Element {
    return (
        <div className="h-screen flex flex-col bg-[#f5f2e9] text-[#1a1a1a] overflow-hidden">
            <Navbar onNavigate={onNavigate} currentPage={currentPage} user={user} />
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    )
}
