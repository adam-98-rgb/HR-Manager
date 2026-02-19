import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EditCandidateModalProps {
    isOpen: boolean
    candidate: any
    onClose: () => void
    onSave: (candidate: any) => void
    defaultCompany: string
}

export default function EditCandidateModal({ isOpen, candidate, onClose, onSave, defaultCompany }: EditCandidateModalProps): JSX.Element {
    const [formData, setFormData] = useState<any>({
        id: '',
        nom: '',
        prenom: '',
        dateNaissance: '',
        dateEmbauche: '',
        address: '',
        cin: '',
        cnss: '',
        gender: 'Male',
        salaireNet: '',
        rib: '',
        phone: '',
        email: '',
        contratPath: '',
        engDomicilePath: '',
        company: defaultCompany,
        function: ''
    })

    useEffect(() => {
        if (isOpen && candidate) {
            let nom = candidate.nom || ''
            let prenom = candidate.prenom || ''

            // fallback if nom/prenom are missing but fullName exists
            if (!nom && !prenom && candidate.fullName) {
                const parts = candidate.fullName.split(' ')
                nom = parts[0] || ''
                prenom = parts.slice(1).join(' ')
            }

            setFormData({
                ...candidate,
                nom,
                prenom,
                company: defaultCompany // Ensure company consistency
            })
        }
    }, [isOpen, candidate, defaultCompany])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const fullName = `${formData.nom} ${formData.prenom}`.trim()
        onSave({ ...formData, fullName })
        onClose()
    }



    const inputClasses = "w-full bg-white/5 hover:bg-white/10 border border-white/5 focus:border-[#ffcc4d]/50 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/20 transition-all outline-none focus:ring-4 focus:ring-[#ffcc4d]/10"
    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1"

    useEffect(() => {
        // Log to debug if files are being populated
        if (isOpen) {
            console.log('Edit Modal Opened with Data:', candidate)
            console.log('Form Data State:', formData)
        }
    }, [isOpen, candidate])

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
                        className="relative bg-[#1e1e1e] w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
                    >
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-['Outfit'] tracking-tight mb-1">Edit Candidate</h2>
                                <p className="text-[#ffcc4d] font-medium text-xs">Update candidate details</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all text-sm font-bold active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            {/* Grid Layout - 3 Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Identity Row */}
                                <div className="space-y-4">
                                    <label className={labelClasses}>Nom</label>
                                    <input
                                        required
                                        type="text"
                                        className={inputClasses}
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Prénom</label>
                                    <input
                                        required
                                        type="text"
                                        className={inputClasses}
                                        value={formData.prenom}
                                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Gender</label>
                                    <select
                                        className={inputClasses}
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Male" className="bg-[#1e1e1e]">Male</option>
                                        <option value="Female" className="bg-[#1e1e1e]">Female</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClasses}>Date Naissance</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateNaissance}
                                        onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Phone</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Email</label>
                                    <input
                                        type="email"
                                        className={inputClasses}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {/* Full Width: Address */}
                                <div className="col-span-full space-y-4">
                                    <label className={labelClasses}>Address</label>
                                    <textarea
                                        className={`${inputClasses} min-h-[80px] resize-none`}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                {/* row 4: RIB, CNSS, Fonction (All in 1 Row) */}
                                <div className="space-y-4">
                                    <label className={labelClasses}>RIB</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.rib}
                                        onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>CNSS</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.cnss}
                                        onChange={(e) => setFormData({ ...formData, cnss: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Fonction</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.function}
                                        onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                                    />
                                </div>

                                {/* Row 5: CIN, Salaire Net, Date Embauche */}
                                <div className="space-y-4">
                                    <label className={labelClasses}>CIN</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.cin}
                                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Salaire Net (DH)</label>
                                    <input
                                        type="number"
                                        className={inputClasses}
                                        value={formData.salaireNet}
                                        onChange={(e) => setFormData({ ...formData, salaireNet: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClasses}>Date Embauche</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateEmbauche}
                                        onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Documents Section Removed - Documents are now Generative */}

                            <div className="flex gap-4 pt-4 border-t border-white/5">
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
                                    Update Candidate
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
