import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, FileText, FilePlus, Trash2, Download, ExternalLink, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Employee } from '../data/mockData'
import { cn, getIsFemale } from '../lib/utils'

interface EditEmployeeModalProps {
    employee: Employee | null
    isOpen: boolean
    onClose: () => void
    onSave: (employee: Employee) => void
    refreshKey?: number
    onNext?: () => void
    onPrevious?: () => void
    hasNext?: boolean
    hasPrevious?: boolean
}

interface EmployeeDocument {
    id: number
    name: string
    path: string
    upload_date: string
}

export default function EditEmployeeModal({
    employee,
    isOpen,
    onClose,
    onSave,
    refreshKey,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious
}: EditEmployeeModalProps): JSX.Element {
    const [previewPath, setPreviewPath] = useState('')
    const [formData, setFormData] = useState<Employee | null>(null)
    const [documents, setDocuments] = useState<EmployeeDocument[]>([])
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (employee) {
            setFormData(employee)
            setPreviewPath('') // Clear preview when switching employees
            fetchDocuments()
        }
    }, [employee, refreshKey])

    const fetchDocuments = async () => {
        if (!employee) return
        try {
            const docs = await window.api.db.getEmployeeDocuments({
                employeeId: employee.id,
                companyName: employee.company
            })
            setDocuments(docs)
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        }
    }

    const handleUploadDocument = async () => {
        if (!employee) return
        try {
            const filePath = await window.api.file.select({
                filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
            })
            if (!filePath) return

            setIsUploading(true)
            const name = filePath.split(/[/\\]/).pop() || 'document.pdf'
            const savedPath = await window.api.file.saveEmployeeDocument({
                companyName: employee.company,
                employeeId: employee.id,
                filePath
            })

            await window.api.db.addEmployeeDocument({
                employeeId: employee.id,
                companyName: employee.company,
                name,
                path: savedPath
            })

            await fetchDocuments()
        } catch (error) {
            console.error('Failed to upload document:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteDocument = async (id: number) => {
        try {
            await window.api.db.deleteEmployeeDocument({ id })
            await fetchDocuments()
        } catch (error) {
            console.error('Failed to delete document:', error)
        }
    }

    const handleOpenDocument = (path: string) => {
        window.api.file.openPath({ path })
    }

    const handleDownloadDocument = (path: string) => {
        window.api.file.download({ path })
    }

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

    const getImageUrl = (path: string) => {
        if (!path) return ''
        if (path.startsWith('http') || path.startsWith('/storage') || path.startsWith('/icons')) {
            return refreshKey && path.startsWith('/storage') ? `${path}?t=${refreshKey}` : path
        }
        if (path.includes(':') || path.startsWith('/') || path.startsWith('\\')) {
            const url = `file:///${path.replace(/\\/g, '/')}`
            return refreshKey ? `${url}?t=${refreshKey}` : url
        }
        return path
    }

    if (!formData) return <></>

    const inputClasses = "w-full bg-white/5 hover:bg-white/10 border border-white/5 focus:border-[#ffcc4d]/50 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/20 transition-all outline-none focus:ring-4 focus:ring-[#ffcc4d]/10"
    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1"

    const defaultIcon = `/icons/${getIsFemale(formData.gender) ? 'female.png' : 'male.png'}`;

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

                    {/* Navigation Arrows */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-12 pointer-events-none z-[120]">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
                            disabled={!hasPrevious}
                            className={cn(
                                "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto active:scale-90",
                                hasPrevious ? "hover:bg-[#ffcc4d] hover:text-[#1e1e1e] text-white cursor-pointer" : "opacity-0 invisible"
                            )}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                            disabled={!hasNext}
                            className={cn(
                                "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto active:scale-90", hasNext ? "hover:bg-[#ffcc4d] hover:text-[#1e1e1e] text-white cursor-pointer" : "opacity-0 invisible"
                            )}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[#1e1e1e] w-full max-w-[1400px] rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row border border-white/10"
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
                                        {formData.photo || previewPath ? (
                                            <img
                                                src={previewPath || getImageUrl(formData.photo)}
                                                alt={formData.fullName}
                                                className="w-full h-full object-cover rounded-[20px] bg-slate-800"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).onerror = null;
                                                    (e.target as HTMLImageElement).src = defaultIcon;
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={defaultIcon}
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

                        {/* MIDDLE: Details Form */}
                        <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#1e1e1e] flex flex-col border-r border-white/10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="w-1 h-8 bg-[#ffcc4d] rounded-full"></span>
                                    Personal Details
                                </h3>
                                {/* Close Button Desktop (Hidden on max-w layout to keep things clean, or moved) */}
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
                                    <label className={labelClasses}>RIB</label>
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
                                            <select
                                                className={inputClasses}
                                                value={formData.motif || ''}
                                                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                            >
                                                <option value="" className="bg-[#1e1e1e]">Sélectionner un motif</option>
                                                <option value="Démission" className="bg-[#1e1e1e]">Démission</option>
                                                <option value="Licenciement" className="bg-[#1e1e1e]">Licenciement</option>
                                                <option value="Licenciement FG" className="bg-[#1e1e1e]">Licenciement FG</option>
                                                <option value="Abandon de Poste" className="bg-[#1e1e1e]">Abandon de Poste</option>
                                                <option value="Mutation" className="bg-[#1e1e1e]">Mutation</option>
                                            </select>
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

                        {/* RIGHT SIDE: Documents Section */}
                        <div className="w-full md:w-[320px] bg-black/20 p-8 flex flex-col relative shrink-0 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Documents</h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">PDF Attachments</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="md:absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all text-sm font-bold active:scale-95"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleUploadDocument}
                                disabled={isUploading}
                                className="w-full border-2 border-dashed border-white/10 hover:border-[#ffcc4d] hover:bg-[#ffcc4d]/5 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3 mb-8"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-[#ffcc4d] animate-spin" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-[#ffcc4d]/10 flex items-center justify-center text-[#ffcc4d] group-hover:scale-110 transition-transform">
                                        <FilePlus className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white">Select PDF</p>
                                    <p className="text-[10px] text-slate-500">Add new employee document</p>
                                </div>
                            </button>

                            <div className="space-y-3 flex-1">
                                {documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-600 opacity-50 italic">
                                        <FileText className="w-12 h-12 mb-2 stroke-1" />
                                        <p className="text-xs">No documents uploaded</p>
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="group/doc bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 transition-all hover:translate-x-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate group-hover/doc:text-[#ffcc4d] transition-colors" title={doc.name}>
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        {new Date(doc.upload_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDocument(doc.path)}
                                                    className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center group/btn"
                                                    title="Open"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadDocument(doc.path)}
                                                    className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="flex-1 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all flex items-center justify-center"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
