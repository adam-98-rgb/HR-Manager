import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, Loader2, ArrowRight, User, Key, ArrowLeft } from 'lucide-react'

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [recoveryEmail, setRecoveryEmail] = useState('')
    const [isRecoveryMode, setIsRecoveryMode] = useState(false)
    const [recoveryResult, setRecoveryResult] = useState<{ name: string; password: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // @ts-ignore
            const user = await window.api.db.login({ username, password })
            if (user) {
                onLogin(user)
            } else {
                setError('Invalid username or password')
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setRecoveryResult(null)

        try {
            // @ts-ignore
            const result = await window.api.db.recoverAccount({ email: recoveryEmail })
            if (result) {
                setRecoveryResult(result)
            } else {
                setError('No account found with this email')
            }
        } catch (err) {
            console.error('Recovery error:', err)
            setError('An error occurred during recovery')
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 relative z-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <div className="bg-[#ffcc4d] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-lg shadow-[#ffcc4d]/20">
                        {isRecoveryMode ? (
                            <Key className="w-8 h-8 text-[#1a1a1a]" />
                        ) : (
                            <LogIn className="w-8 h-8 text-[#1a1a1a]" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold mb-2">
                        {isRecoveryMode ? 'Account Recovery' : 'Welcome Back'}
                    </h1>
                    <p className="text-slate-400">
                        {isRecoveryMode
                            ? 'Enter your email to recover your credentials'
                            : 'Please enter your details to sign in'}
                    </p>
                </div>

                {!isRecoveryMode ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(true)
                                        setError('')
                                    }}
                                    className="text-[10px] font-bold text-[#ffcc4d] hover:underline uppercase tracking-widest"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ffcc4d] text-[#1a1a1a] font-bold py-4 rounded-2xl hover:bg-[#ffdb80] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#ffcc4d]/10"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {recoveryResult ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#ffcc4d]/10 border border-[#ffcc4d]/20 rounded-2xl p-6 space-y-4"
                            >
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#ffcc4d] uppercase tracking-[0.2em] mb-4">Credentials Recovered</p>
                                    <div className="space-y-3">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Username</p>
                                            <p className="text-lg font-bold text-white">{recoveryResult.name}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Password</p>
                                            <p className="text-lg font-bold text-white">{recoveryResult.password}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsRecoveryMode(false)
                                        setRecoveryResult(null)
                                        setUsername(recoveryResult.name)
                                    }}
                                    className="w-full bg-[#ffcc4d] text-black font-black py-3 rounded-xl hover:scale-[1.02] transition-transform text-sm"
                                >
                                    Back to Login
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleRecover} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Recovery Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ffcc4d] transition-colors w-5 h-5" />
                                        <input
                                            type="email"
                                            value={recoveryEmail}
                                            onChange={e => setRecoveryEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#ffcc4d]/20 focus:border-[#ffcc4d] outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Email Address"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !recoveryEmail}
                                    className="w-full bg-[#ffcc4d] text-[#1a1a1a] font-bold py-4 rounded-2xl hover:bg-[#ffdb80] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Recover Credentials'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(false)
                                        setError('')
                                    }}
                                    className="w-full text-slate-500 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="mt-10 pt-10 border-t border-white/5 text-center">
                    <p className="text-slate-500 text-sm">
                        HR Management System v1.0
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
