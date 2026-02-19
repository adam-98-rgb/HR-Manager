import {
    Users,
    ArrowUpRight,
    Play,
    Pause,
    Clock,
    CheckCircle2,
    MoreHorizontal,
    Monitor,
    Laptop,
    Sparkles,
    Calendar as CalendarIcon,
    ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'
import { useLanguage } from '../contexts/LanguageContext'

export default function DashboardPage({ user }: { user: any }): JSX.Element {
    const { t } = useLanguage()
    const [stats, setStats] = useState({ employees: 0, companies: 0 })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // @ts-ignore
                const companies = await window.api.db.getCompanies()

                let allEmployeesCount = 0
                if (companies.length > 0) {
                    for (const company of companies) {
                        try {
                            // Fetch en cours employees for each company
                            // @ts-ignore
                            const employees = await window.api.db.getEmployees({ companyName: company.name, status: 'En cours' })
                            allEmployeesCount += employees.length
                        } catch (e) {
                            console.error(`Failed to fetch employees for ${company.name}:`, e)
                        }
                    }
                }

                setStats({
                    employees: allEmployeesCount,
                    companies: companies.length
                })
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            }
        }
        fetchStats()
    }, [])
    return (
        <div className="h-[calc(100vh-5rem)] w-full bg-[#0a0a0a] text-white p-8 space-y-10 animate-fade-in overflow-y-auto custom-scrollbar">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ffcc4d]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Header Section */}
            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent font-['Outfit'] tracking-tight mb-4">
                        {t('welcome')} {user?.name || 'Nixtio'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                        <StatSummary label={t('interviews')} value="15%" color="bg-white/10" textColor="text-white" />
                        <StatSummary label={t('hired')} value="15%" color="bg-[#ffcc4d]" textColor="text-black" />
                        <StatSummary label={t('projectTime')} value="60%" color="bg-white/5 border border-white/10" isStriped />
                        <StatSummary label={t('output')} value="10%" color="bg-white/5 border border-white/10" />
                    </div>
                </div>

                <div className="flex items-center gap-6 lg:gap-12 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] shadow-2xl">
                    <HeaderMiniStat
                        count={stats.employees.toString()}
                        label={t('employee')}
                        icon={<div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#141414] bg-gradient-to-br from-slate-700 to-slate-800" />
                            ))}
                        </div>}
                    />
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <HeaderMiniStat
                        count="56"
                        label={t('hirings')}
                        icon={<div className="w-10 h-10 rounded-2xl bg-[#ffcc4d]/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#ffcc4d]" />
                        </div>}
                    />
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <HeaderMiniStat
                        count={stats.companies.toString()}
                        label={t('companies')}
                        icon={<div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-400" />
                        </div>}
                    />
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-8 relative">

                {/* Profile Card */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 h-full relative overflow-hidden group/card shadow-2xl transition-all hover:bg-white/[0.07]">
                        <div className="w-full aspect-square rounded-[32px] overflow-hidden mb-6 shadow-2xl relative group-hover/card:scale-[1.02] transition-transform duration-500 bg-white/5 flex items-center justify-center">
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-full h-full object-cover saturate-[0.8] hover:saturate-100 transition-all duration-500"
                                />
                            ) : (
                                <img
                                    src={`/icons/${user?.gender === 'Female' ? 'female.png' : 'male.png'}`}
                                    alt={user?.name}
                                    className="w-full h-full object-cover saturate-[0.8] hover:saturate-100 transition-all duration-500 opacity-80"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{user?.name}</h3>
                                <p className="text-slate-400 font-medium font-['Outfit'] uppercase text-[10px] tracking-widest">{user?.gender || 'Administrator'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-[#141414] rounded-[40px] p-8 h-full border border-white/5 shadow-2xl relative overflow-hidden group hover:bg-[#1a1a1a] transition-all">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#ffcc4d]" />
                                {t('progress')}
                            </h4>
                            <div className="p-2 bg-white/5 rounded-2xl group-hover:bg-[#ffcc4d] group-hover:text-black transition-all">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-10">
                            <span className="text-5xl font-bold text-white tracking-tight">6.1 h</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t('workTime')}<br />{t('week')}</span>
                        </div>
                        <div className="flex items-end justify-between h-36 gap-3 pb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={`${day}-${i}`} className="flex flex-col items-center gap-4 flex-1">
                                    <div
                                        className={cn(
                                            "w-full rounded-2xl transition-all duration-700 relative overflow-hidden",
                                            day === 'F' ? "bg-[#ffcc4d] h-28 shadow-lg shadow-[#ffcc4d]/20" : "bg-white/10 h-12 hover:bg-white/20",
                                            i === 1 && "h-16",
                                            i === 4 && "h-22"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                    <span className={cn("text-[10px] font-black tracking-widest", day === 'F' ? "text-[#ffcc4d]" : "text-slate-600")}>{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Time Tracker Card */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 h-full border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between group">
                        <div className="flex justify-between items-center w-full mb-4">
                            <h4 className="text-xl font-bold text-white">{t('timeTracker')}</h4>
                            <div className="p-2 bg-white/5 rounded-2xl">
                                <Clock className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center py-4">
                            <svg className="w-44 h-44 transform -rotate-90">
                                <circle cx="88" cy="88" r="78" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                <circle
                                    cx="88" cy="88" r="78"
                                    fill="transparent" stroke="#ffcc4d" strokeWidth="10"
                                    strokeDasharray="490" strokeDashoffset="140"
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_0_8px_rgba(255,204,77,0.4)]"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-4xl font-black text-white tracking-tighter">02:35</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('workTime')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4">
                            <button className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all text-[#ffcc4d]">
                                <Play className="w-6 h-6 fill-current" />
                            </button>
                            <button className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all text-slate-400">
                                <Pause className="w-6 h-6 fill-current" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Onboarding Card */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-[#141414] rounded-[40px] p-8 h-full border border-white/5 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-xl font-bold text-white">{t('onboarding')}</h4>
                            <span className="text-3xl font-black text-[#ffcc4d] tracking-tighter">18%</span>
                        </div>

                        <div className="flex gap-2 h-10 bg-white/5 rounded-2xl p-1.5 mb-8">
                            <div className="bg-[#ffcc4d] flex-[0.3] rounded-xl flex items-center justify-center text-[10px] font-black text-black">{t('tasks')}</div>
                            <div className="bg-white/10 flex-[0.5] rounded-xl" />
                            <div className="bg-white/5 flex-[0.2] rounded-xl" />
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex-1 shadow-inner">
                            <div className="flex justify-between items-center mb-6">
                                <h5 className="font-bold text-lg text-white">{t('tasks')}</h5>
                                <span className="text-2xl font-black tracking-tighter text-white/20">2/8</span>
                            </div>
                            <div className="space-y-5">
                                <OnboardingItem label="Interview" time="Sep 13, 08:30" active />
                                <OnboardingItem label="Team Meeting" time="Sep 13, 10:30" active />
                                <OnboardingItem label="Project Update" time="Sep 13, 13:00" />
                                <OnboardingItem label="Discuss Q3 Goals" time="Sep 13, 14:45" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <CollapsibleItem label={t('pension')} />

                    <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 shadow-xl group hover:bg-white/[0.08] transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-bold text-white">{t('devices')}</h4>
                            <button className="p-2 bg-white/5 rounded-xl hover:text-[#ffcc4d] transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-black rounded-2xl flex items-center justify-center border border-white/5 shadow-lg group-hover:scale-110 transition-transform">
                                <Laptop className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-white">MacBook Air</p>
                                <p className="text-xs font-medium text-slate-500">Version M1 • 2024</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                    </div>

                    <CollapsibleItem label={t('compensation')} />
                    <CollapsibleItem label={t('benefits')} />
                </div>

                {/* Calendar Section */}
                <div className="col-span-12 lg:col-span-9">
                    <div className="bg-[#141414] rounded-[48px] p-10 h-full border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
                            <span className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">{t('previous')}</span>
                            <div className="flex items-center gap-4 bg-white/5 px-8 py-3 rounded-full border border-white/10">
                                <CalendarIcon className="w-5 h-5 text-[#ffcc4d]" />
                                <h4 className="text-xl font-black text-white tracking-tight">September 2024</h4>
                            </div>
                            <span className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">{t('nextMonth')}</span>
                        </div>

                        <div className="grid grid-cols-7 gap-6 mb-12">
                            {['Mon 22', 'Tue 23', 'Wed 24', 'Thu 25', 'Fri 26', 'Sat 27', 'Sun 28'].map((day, i) => (
                                <div key={day} className="text-center group/day cursor-pointer">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest group-hover/day:text-slate-400 transition-colors">
                                        {day.split(' ')[0]}
                                    </p>
                                    <div className={cn(
                                        "w-14 h-14 mx-auto flex items-center justify-center rounded-2xl text-xl font-black transition-all duration-300",
                                        i === 2
                                            ? "bg-[#ffcc4d] text-black shadow-xl shadow-[#ffcc4d]/20 scale-110"
                                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
                                    )}>
                                        {day.split(' ')[1]}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-8 relative ml-16 border-l-2 border-white/5 pl-10 pb-4">
                            <TimeLabel time="08:00 AM" />

                            {/* Featured Event Card */}
                            <div className="bg-[#ffcc4d] text-black p-6 rounded-[32px] flex items-center justify-between shadow-2xl shadow-[#ffcc4d]/20 absolute top-10 -left-6 w-[85%] group/event hover:scale-[1.01] transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black tracking-tight">Weekly Team Sync</p>
                                        <p className="text-sm font-bold opacity-60">Discuss progress, blockers and Q4 goals</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full border-4 border-[#ffcc4d] bg-black/20" />
                                        ))}
                                    </div>
                                    <div className="p-3 bg-black text-white rounded-2xl">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <TimeLabel time="09:00 AM" />
                            <TimeLabel time="10:00 AM" />
                            <TimeLabel time="11:00 AM" />

                            {/* Secondary Event Card */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-center justify-between shadow-xl absolute bottom-0 right-10 w-[60%] hover:bg-white/10 transition-all group/subevent">
                                <div className="flex gap-6 items-center">
                                    <div className="w-12 h-12 rounded-full border-2 border-[#ffcc4d] bg-[#ffcc4d]/10 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-[#ffcc4d]" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">Onboarding Session</p>
                                        <p className="text-xs text-slate-500">Introduction phase for 3 new hires</p>
                                    </div>
                                </div>
                                <MoreHorizontal className="w-6 h-6 text-slate-600 group-hover/subevent:text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatSummary({ label, value, color, textColor = 'text-slate-400', isStriped = false }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">{label}</span>
            <div className={cn(
                "h-9 px-5 flex items-center rounded-2xl text-[12px] font-black transition-all hover:scale-105",
                color,
                textColor,
                isStriped && "bg-gradient-to-r from-white/10 to-white/5 opacity-80"
            )}>
                {value}
            </div>
        </div>
    )
}

function HeaderMiniStat({ count, label, icon }) {
    return (
        <div className="flex items-center gap-4 group cursor-default">
            {icon}
            <div>
                <p className="text-3xl font-black text-white leading-none mb-1 group-hover:text-[#ffcc4d] transition-colors">{count}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
            </div>
        </div>
    )
}

function OnboardingItem({ label, time, active = false }) {
    return (
        <div className="flex items-center gap-5 group cursor-pointer">
            <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                active ? "bg-[#ffcc4d]/20 text-[#ffcc4d] shadow-lg shadow-[#ffcc4d]/5" : "bg-white/5 text-slate-700 hover:bg-white/10"
            )}>
                {active ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />}
            </div>
            <div className="flex-1">
                <p className={cn("text-sm font-bold leading-none mb-1.5 transition-colors", active ? "text-white" : "text-slate-600 group-hover:text-slate-400")}>
                    {label}
                </p>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{time}</p>
            </div>
            {active && <MoreHorizontal className="w-5 h-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
    )
}

function CollapsibleItem({ label }) {
    return (
        <div className="bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[32px] flex justify-between items-center shadow-lg border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all group">
            <span className="text-base font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-[#ffcc4d] group-hover:text-black transition-all">
                <ArrowUpRight className="w-4 h-4 rotate-90" />
            </div>
        </div>
    )
}

function TimeLabel({ time }) {
    return (
        <div className="h-16 flex items-center">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest absolute -left-20">{time}</span>
        </div>
    )
}
