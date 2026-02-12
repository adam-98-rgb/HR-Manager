import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, MapPin, Calendar, CreditCard, Heart, Fingerprint, User, FileText, Building2 } from 'lucide-react'
import { Employee } from '../data/mockData'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/dateUtils'

interface EmployeeModalProps {
    employee: Employee | null
    isOpen: boolean
    onClose: () => void
}

export default function EmployeeModal({ employee, isOpen, onClose }: EmployeeModalProps): JSX.Element {
    if (!employee) return <></>

    const getImageUrl = (path: string) => {
        if (!path) return ''
        if (path.startsWith('http') || path.startsWith('/storage') || path.startsWith('/icons')) return path
        if (path.includes(':') || path.startsWith('/') || path.startsWith('\\')) {
            return `file:///${path.replace(/\\/g, '/')}`
        }
        return path
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[#1e1e1e] w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh]"
                    >
                        {/* Close Button Mobile */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* LEFT SIDE: Profile & Key Info */}
                        <div className="w-full md:w-[400px] bg-black/20 border-r border-white/10 p-8 flex flex-col items-center text-center relative shrink-0 overflow-y-auto custom-scrollbar">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#ffcc4d]/10 to-transparent opacity-50"></div>

                            {/* Photo */}
                            <div className="relative mb-6 mt-4">
                                <div className="w-40 h-40 rounded-[32px] p-2 bg-white/5 border border-white/10 shadow-2xl">
                                    {employee.photo ? (
                                        <img
                                            src={getImageUrl(employee.photo)}
                                            alt={employee.fullName}
                                            className="w-full h-full object-cover rounded-[24px] bg-white/5"
                                        />
                                    ) : (
                                        <img
                                            src={getImageUrl(`/icons/${employee.gender === 'Female' ? 'female.png' : 'male.png'}`)}
                                            alt={employee.fullName}
                                            className="w-full h-full object-cover rounded-[24px] bg-white/5 opacity-80"
                                        />
                                    )}
                                </div>
                                <span className={cn(
                                    "absolute bottom-0 right-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-lg translate-x-2 translate-y-2",
                                    employee.status === 'En cours'
                                        ? "bg-[#1e1e1e] text-emerald-400 border-emerald-500/20"
                                        : "bg-[#1e1e1e] text-amber-400 border-amber-500/20"
                                )}>
                                    {employee.status}
                                </span>
                            </div>

                            {/* Name & Function */}
                            <h2 className="text-2xl font-bold text-white font-['Outfit'] tracking-tight mb-2">{employee.fullName}</h2>
                            <p className="text-[#ffcc4d] font-medium text-sm mb-8 bg-[#ffcc4d]/10 px-4 py-1.5 rounded-full border border-[#ffcc4d]/20">{employee.function}</p>

                            {/* Contact Info */}
                            <div className="w-full space-y-4 mb-8">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#ffcc4d]/10 border border-[#ffcc4d]/20 text-left shadow-inner">
                                    <div className="w-10 h-10 rounded-xl bg-[#ffcc4d]/10 flex items-center justify-center flex-shrink-0 text-[#ffcc4d]">
                                        <Fingerprint className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee ID</p>
                                        <p className="text-sm font-black text-[#ffcc4d]">{employee.id}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-[#ffcc4d]">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-bold text-white truncate">{employee.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-[#ffcc4d]">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                                        <p className="text-sm font-bold text-white">{employee.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Buttons */}
                            <div className="mt-auto w-full flex flex-wrap gap-2 justify-center">
                                <button className="flex-1 min-w-[100px] flex flex-col items-center justify-center gap-2 px-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-white/5 hover:border-white/10 group">
                                    <FileText className="w-5 h-5 text-[#ffcc4d] group-hover:scale-110 transition-transform" />
                                    <span>A.Travail</span>
                                </button>
                                <button className="flex-1 min-w-[100px] flex flex-col items-center justify-center gap-2 px-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-white/5 hover:border-white/10 group">
                                    <FileText className="w-5 h-5 text-[#ffcc4d] group-hover:scale-110 transition-transform" />
                                    <span>A.Salaire</span>
                                </button>
                                <button className="flex-1 min-w-[100px] flex flex-col items-center justify-center gap-2 px-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-white/5 hover:border-white/10 group">
                                    <FileText className="w-5 h-5 text-[#ffcc4d] group-hover:scale-110 transition-transform" />
                                    <span>Dom.Crédit</span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Details Grid */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#1e1e1e] relative">
                            {/* Close Button Desktop */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all text-sm font-bold active:scale-95"
                            >
                                <span>Close</span>
                                <X className="w-4 h-4" />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <span className="w-1 h-8 bg-[#ffcc4d] rounded-full"></span>
                                Employee Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem icon={User} label="Gender" value={employee.gender} />

                                <InfoItem icon={Calendar} label="Date Naissance" value={formatDate(employee.dateNaissance || '1990-01-01')} />
                                <InfoItem icon={Calendar} label="Date Embauche" value={formatDate(employee.dateEmbauche)} />

                                <InfoItem icon={Calendar} label="Date Ancienneté" value={formatDate(employee.dateAnciennete)} />
                                <InfoItem icon={Heart} label="Situation" value={employee.situation} />

                                <InfoItem icon={CreditCard} label="RIB" value={employee.rib || 'N/A'} />
                                <InfoItem icon={CreditCard} label="N° CIN" value={employee.cin} />

                                <InfoItem icon={Fingerprint} label="N° CNSS" value={employee.cnss} />
                                <div className="md:col-span-1"></div>

                                <div className="md:col-span-2">
                                    <InfoItem icon={MapPin} label="Address" value={employee.address} />
                                </div>

                                {employee.status === 'Sortie' && (
                                    <>
                                        <InfoItem icon={Calendar} label="Date Sortie" value={employee.dateSortie ? formatDate(employee.dateSortie) : 'N/A'} />
                                        <InfoItem icon={FileText} label="Motif Sortie" value={employee.motif || 'N/A'} />
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ffcc4d] group-hover:text-[#1e1e1e] transition-all duration-300">
                <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#1e1e1e] transition-colors" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-base font-bold text-white group-hover:text-[#ffcc4d] transition-colors">{value}</p>
            </div>
        </div>
    )
}
