import Navbar from './Navbar'
import { PageId } from '../App'

interface LayoutProps {
    children: React.ReactNode
    onNavigate: (page: PageId) => void
    currentPage: PageId
    user: any
}

export default function Layout({ children, onNavigate, currentPage, user }: LayoutProps): JSX.Element {
    return (
        <div className="h-screen flex flex-col bg-[#f5f2e9] text-[#1a1a1a] overflow-hidden print:bg-white print:h-auto print:overflow-visible">
            <div className="print:hidden">
                <Navbar onNavigate={onNavigate} currentPage={currentPage} user={user} />
            </div>
            <main className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
                {children}
            </main>
        </div>
    )
}
