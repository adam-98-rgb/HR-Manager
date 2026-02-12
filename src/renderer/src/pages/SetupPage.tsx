import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Building, Mail, Lock, Plus, Trash2, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '../lib/utils'

interface Company {
    name: string
    address: string
    ice: string
    if_num: string
    cnss: string
    representant: string
    logo: string
}

export default function SetupPage({ onComplete }: { onComplete: (user: any) => void }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState({ name: '', email: '', password: '', gender: 'Male', picture: '' })
    const [companies, setCompanies] = useState<Company[]>([{
        name: '', address: '', ice: '', if_num: '', cnss: '', representant: '', logo: ''
    }])

    const handleAddCompany = () => {
        setCompanies([...companies, { name: '', address: '', ice: '', if_num: '', cnss: '', representant: '', logo: '' }])
    }

    const handleRemoveCompany = (index: number) => {
        if (companies.length === 1) return
        setCompanies(companies.filter((_, i) => i !== index))
    }

    const updateCompany = (index: number, field: keyof Company, value: string) => {
        const newCompanies = [...companies]
        newCompanies[index] = { ...newCompanies[index], [field]: value }
        setCompanies(newCompanies)
    }

    const handleSelectLogo = async (index: number) => {
        try {
            // @ts-ignore
            const filePath = await window.api.db.selectFile()
            if (filePath) {
                updateCompany(index, 'logo', filePath)
            }
        } catch (error) {
            console.error('Failed to select file:', error)
        }
    }

    const handleSelectPicture = async () => {
        try {
            // @ts-ignore
            const filePath = await window.api.db.selectFile()
            if (filePath) {
                setUser({ ...user, picture: filePath })
            }
        } catch (error) {
            console.error('Failed to select picture:', error)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // @ts-ignore
            const userData = await window.api.db.setup({ user: { ...user, role: 'Admin' }, companies })
            onComplete(userData)
        } catch (error) {
            console.error('Setup failed:', error)
            alert('Setup failed. Please check the information and try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ffcc4d]/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ffcc4d]/5 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 relative z-10 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome to HR Management</h1>
                        <p className="text-slate-400">Let's set up your account and workspace</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                className={`h-2 w-8 rounded-full transition-all duration-300 ${step === i ? 'bg-[#ffcc4d]' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                        <input
                                            type="text"
                                            value={user.name}
                                            onChange={e => setUser({ ...user, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Username"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                        <input
                                            type="email"
                                            value={user.email}
                                            onChange={e => setUser({ ...user, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                        <input
                                            type="password"
                                            value={user.password}
                                            onChange={e => setUser({ ...user, password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Password"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                                    <div className="flex gap-4">
                                        {['Male', 'Female'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setUser({ ...user, gender: g })}
                                                className={cn(
                                                    "flex-1 py-4 rounded-2xl border transition-all text-sm font-bold",
                                                    user.gender === g
                                                        ? "bg-[#ffcc4d] border-[#ffcc4d] text-[#1a1a1a]"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Profile Picture (Optional)</label>
                                <button
                                    onClick={handleSelectPicture}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 flex justify-between items-center group transition-all hover:bg-white/10"
                                >
                                    <span className={user.picture ? "text-white truncate" : "text-slate-500"}>
                                        {user.picture ? user.picture.split(/[/\\]/).pop() : "Select profile picture..."}
                                    </span>
                                    <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-[#ffcc4d] transition-colors" />
                                </button>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!user.name || !user.email || !user.password}
                                    className="w-full bg-[#ffcc4d] text-[#1a1a1a] font-bold py-4 rounded-2xl hover:bg-[#ffdb80] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                                >
                                    Continue to Company Info
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {companies.map((company, index) => (
                                    <div key={index} className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Building className="w-5 h-5 text-[#ffcc4d]" />
                                                Company #{index + 1}
                                            </h3>
                                            {companies.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveCompany(index)}
                                                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Company Name</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                        placeholder="Company Name"
                                                        value={company.name}
                                                        onChange={e => updateCompany(index, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Address</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                        placeholder="Address"
                                                        value={company.address}
                                                        onChange={e => updateCompany(index, 'address', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">ICE</label>
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                            placeholder="ICE"
                                                            value={company.ice}
                                                            onChange={e => updateCompany(index, 'ice', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">IF</label>
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                            placeholder="IF"
                                                            value={company.if_num}
                                                            onChange={e => updateCompany(index, 'if_num', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">CNSS</label>
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                            placeholder="CNSS"
                                                            value={company.cnss}
                                                            onChange={e => updateCompany(index, 'cnss', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Representant</label>
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm"
                                                            placeholder="Representant"
                                                            value={company.representant}
                                                            onChange={e => updateCompany(index, 'representant', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Company Logo *</label>
                                                    <button
                                                        onClick={() => handleSelectLogo(index)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 focus:border-[#ffcc4d] outline-none text-sm text-left flex justify-between items-center group/logo"
                                                    >
                                                        <span className={company.logo ? "text-white truncate" : "text-slate-500"}>
                                                            {company.logo ? company.logo.split(/[/\\]/).pop() : "Select Logo File"}
                                                        </span>
                                                        <ImageIcon className="w-4 h-4 text-slate-500 group-hover/logo:text-[#ffcc4d] transition-colors" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddCompany}
                                    className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Another Company
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || companies.some(c => !c.name || !c.logo)}
                                    className="flex-[2] bg-[#ffcc4d] text-[#1a1a1a] font-bold py-4 rounded-2xl hover:bg-[#ffdb80] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Complete Setup'
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="w-full text-slate-500 hover:text-white text-sm font-semibold transition-colors mt-2"
                            >
                                Back to User Info
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
