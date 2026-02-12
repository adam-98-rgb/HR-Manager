import { Bell, Settings } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

const navItems = [
    { label: 'Dashboard', id: 'dashboard' },
    { label: 'People', id: 'people', active: true },
    { label: 'Hiring', id: 'hiring' },
    { label: 'Devices', id: 'devices' },
    { label: 'Apps', id: 'apps' },
    { label: 'Salary', id: 'salary' },
    { label: 'Calendar', id: 'calendar' },
    { label: 'Reviews', id: 'reviews' },
]

interface NavbarProps {
    onNavigate: (page: 'dashboard' | 'people' | 'settings') => void
    currentPage: 'dashboard' | 'people' | 'settings'
    user: any
}

export default function Navbar({ onNavigate, currentPage, user }: NavbarProps): JSX.Element {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'people' | 'settings'>(currentPage)

    const handleNavigate = (id: 'dashboard' | 'people' | 'settings') => {
        onNavigate(id)
        setActiveTab(id)
    }

    return (
        <nav className="h-20 px-8 flex items-center justify-end gap-8 sticky top-0 z-[100] transition-all duration-300">
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5" />

            {/* Navigation Pills */}
            <div className="relative flex items-center bg-white/5 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id as 'dashboard' | 'people')}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
                            activeTab === item.id && item.id !== 'settings'
                                ? "bg-[#ffcc4d] text-[#1e1e1e] shadow-lg shadow-[#ffcc4d]/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Right Side Icons */}
            <div className="relative flex items-center gap-3">
                <button
                    onClick={() => handleNavigate('settings')}
                    className={cn(
                        "p-2.5 border rounded-full transition-colors shadow-sm",
                        activeTab === 'settings'
                            ? "bg-[#ffcc4d] text-[#1e1e1e] border-[#ffcc4d]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Settings className="w-5 h-5" />
                </button>
                <button className="p-2.5 bg-[#ffcc4d] rounded-full text-[#1e1e1e] hover:bg-[#e6b800] transition-colors shadow-lg shadow-[#ffcc4d]/20 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#1e1e1e] rounded-full border-2 border-[#ffcc4d]"></span>
                </button>
                <div className="h-10 w-[1px] bg-white/10 mx-1"></div>
                <button className="p-1 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border-2 border-transparent group-hover:border-white/20 transition-all flex items-center justify-center">
                        <img
                            src={user?.picture || (user?.gender === 'Female' ? '/icons/female.png' : '/icons/male.png')}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = user?.gender === 'Female' ? '/icons/female.png' : '/icons/male.png' }}
                        />
                    </div>
                </button>
            </div>
        </nav>
    )
}
