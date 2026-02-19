import { Settings, Globe } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { PageId } from '../App'
import { useLanguage } from '../contexts/LanguageContext'

interface NavbarProps {
    onNavigate: (page: PageId) => void
    currentPage: PageId
    user: any
}

export default function Navbar({ onNavigate, currentPage, user }: NavbarProps): JSX.Element {
    const { language, setLanguage, t } = useLanguage()
    const [activeTab, setActiveTab] = useState<PageId>(currentPage)

    const navItems = [
        { label: t('dashboard'), id: 'dashboard' },
        { label: t('people'), id: 'people' },
        { label: t('hiring'), id: 'hiring' },
        { label: t('payroll'), id: 'payroll' },
        { label: t('transport'), id: 'transport' },
        { label: 'Assurance', id: 'assurance' },
    ]

    const handleNavigate = (id: PageId) => {
        onNavigate(id)
        setActiveTab(id)
    }

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'en' : 'fr')
    }

    return (
        <nav className="h-20 px-8 flex items-center justify-end gap-8 sticky top-0 z-[100] transition-all duration-300">
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5" />

            {/* Navigation Pills */}
            <div className="relative flex items-center bg-white/5 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id as PageId)}
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
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 h-[42px] px-4 bg-[#ffcc4d] rounded-full text-[#1e1e1e] hover:bg-[#e6b800] transition-all shadow-lg shadow-[#ffcc4d]/20 group active:scale-95"
                >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-black tracking-tighter uppercase">{language}</span>
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
