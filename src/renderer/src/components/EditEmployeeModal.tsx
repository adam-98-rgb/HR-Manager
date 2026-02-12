import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Employee } from '../data/mockData'
import { cn } from '../lib/utils'

interface EditEmployeeModalProps {
    employee: Employee | null
    isOpen: boolean
    onClose: () => void
    onSave: (employee: Employee) => void
}

export default function EditEmployeeModal({ employee, isOpen, onClose, onSave }: EditEmployeeModalProps): JSX.Element {
    const [previewPath, setPreviewPath] = useState('')
    const [formData, setFormData] = useState<Employee | null>(null)

    useEffect(() => {
        if (employee) {
            setFormData(employee)
            setPreviewPath('') // Clear preview when switching employees
        }
    }, [employee])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData) {
            onSave(formData)
            onClose()
        }
    }

    const handleSelectPhoto = async () => {
        try {
            const result = await window.api.db.selectAndCopy()
            if (result && formData) {
                setFormData({ ...formData, photo: result.originalPath })
                setPreviewPath(result.previewPath)
            }
        } catch (error) {
            console.error('Failed to select photo:', error)
        }
    }

    if (!formData) return <></>

    const inputClasses = "w-full bg-white/5 hover:bg-white/10 border border-white/5 focus:border-[#ffcc4d]/50 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/20 transition-all outline-none focus:ring-4 focus:ring-[#ffcc4d]/10"
    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1"

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                        className="relative bg-[#1e1e1e] w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row border border-white/10"
                    >
                        {/* LEFT SIDE: Profile & Basic Info */}
                        <div className="w-full md:w-[320px] bg-black/20 border-r border-white/10 p-8 flex flex-col relative shrink-0 overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-white font-['Outfit'] tracking-tight mb-1">Edit Profile</h2>
                            <p className="text-[#ffcc4d] font-medium text-xs mb-6">Update employee details</p>

                            <div className="flex flex-col items-center mb-8">
                                <div
                                    onClick={handleSelectPhoto}
                                    className="w-32 h-32 rounded-[24px] bg-[#1e1e1e] p-1.5 shadow-xl ring-1 ring-white/10 group cursor-pointer relative overflow-hidden"
                                >
                                    <div className="w-full h-full bg-white/5 rounded-[20px] flex items-center justify-center border-2 border-dashed border-white/20 hover:border-[#ffcc4d] transition-colors relative overflow-hidden">
                                        {formData.photo ? (
                                            <img
                                                src={previewPath || formData.photo}
                                                alt={formData.fullName}
                                                className="w-full h-full object-cover rounded-[20px] bg-slate-800"
                                            />
                                        ) : (
                                            <img
                                                src={`/icons/${formData.gender === 'Female' ? 'female.png' : 'male.png'}`}
                                                alt="Default Avatar"
                                                className="w-full h-full object-cover rounded-[20px] opacity-80"
                                            />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[20px]">
                                        <span className="text-xs font-bold text-white">Change</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className={labelClasses}>Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className={inputClasses}
                                        placeholder="Full Name"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Function</label>
                                    <input
                                        required
                                        type="text"
                                        className={inputClasses}
                                        placeholder="Function"
                                        value={formData.function}
                                        onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Email</label>
                                    <input
                                        type="email"
                                        className={inputClasses}
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Phone</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Details Form */}
                        <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#1e1e1e] flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="w-1 h-8 bg-[#ffcc4d] rounded-full"></span>
                                    Personal Details
                                </h3>
                                {/* Close Button Desktop */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all text-sm font-bold active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className={labelClasses}>Matricule</label>
                                    <input
                                        disabled
                                        type="text"
                                        className={cn(inputClasses, "opacity-50 cursor-not-allowed")}
                                        value={formData.id}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Gender</label>
                                    <select
                                        className={inputClasses}
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                    >
                                        <option value="Male" className="bg-[#1e1e1e]">Male</option>
                                        <option value="Female" className="bg-[#1e1e1e]">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Date Naissance</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateNaissance || '1990-01-01'}
                                        onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Situation</label>
                                    <select
                                        className={inputClasses}
                                        value={formData.situation}
                                        onChange={(e) => setFormData({ ...formData, situation: e.target.value as any })}
                                    >
                                        <option value="Single" className="bg-[#1e1e1e]">Single</option>
                                        <option value="Married" className="bg-[#1e1e1e]">Married</option>
                                        <option value="Divorced" className="bg-[#1e1e1e]">Divorced</option>
                                        <option value="Widowed" className="bg-[#1e1e1e]">Widowed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClasses}>Date Embauche</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateEmbauche}
                                        onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Date Ancienneté</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateAnciennete}
                                        onChange={(e) => setFormData({ ...formData, dateAnciennete: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className={labelClasses}>N° CIN</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="CIN Number"
                                        value={formData.cin}
                                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>N° CNSS</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="CNSS Number"
                                        value={formData.cnss}
                                        onChange={(e) => setFormData({ ...formData, cnss: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Address</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="Address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className={labelClasses}>RIB (Relevé d'Identité Bancaire)</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="RIB Number"
                                        value={formData.rib}
                                        onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className={labelClasses}>Status</label>
                                    <select
                                        className={inputClasses}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="En cours" className="bg-[#1e1e1e]">En cours</option>
                                        <option value="Sortie" className="bg-[#1e1e1e]">Sortie</option>
                                    </select>
                                </div>

                                {formData.status === 'Sortie' && (
                                    <>
                                        <div>
                                            <label className={labelClasses}>Date Sortie</label>
                                            <input
                                                type="date"
                                                className={inputClasses}
                                                style={{ colorScheme: 'dark' }}
                                                value={formData.dateSortie || ''}
                                                onChange={(e) => setFormData({ ...formData, dateSortie: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Motif</label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Motif de sortie"
                                                value={formData.motif || ''}
                                                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-auto flex gap-4 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-[#ffcc4d] hover:bg-[#e6b800] text-[#1e1e1e] font-bold rounded-2xl transition-all shadow-lg shadow-[#ffcc4d]/20 active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
