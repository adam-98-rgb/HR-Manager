import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, MapPin, Calendar, CreditCard, Heart, Fingerprint, User, FileText, ChevronLeft, ChevronRight, ExternalLink, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Employee } from '../data/mockData'
import { cn, getIsFemale } from '../lib/utils'
import { formatDate } from '../lib/dateUtils'
import PDFPreviewModal from './PDFPreviewModal'
import { AttestationTravailDocument } from './documents/AttestationTravailDocument'
import { AttestationSalaireDocument } from './documents/AttestationSalaireDocument'
import { DomiciliationCreditDocument } from './documents/DomiciliationCreditDocument'
import { DemissionDocument } from './documents/DemissionDocument'
import { STCDocument } from './documents/STCDocument'
import { CertificatTravailDocument } from './documents/CertificatTravailDocument'

interface EmployeeModalProps {
    employee: Employee | null
    isOpen: boolean
    onClose: () => void
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

export default function EmployeeModal({
    employee,
    isOpen,
    onClose,
    refreshKey,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious
}: EmployeeModalProps): JSX.Element {
    const [documents, setDocuments] = useState<EmployeeDocument[]>([])
    const [previewDoc, setPreviewDoc] = useState<{ content: JSX.Element, title: string } | null>(null)

    useEffect(() => {
        if (employee && isOpen) {
            fetchDocuments()
        }
    }, [employee, isOpen, refreshKey])

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

    const handleOpenDocument = (path: string) => {
        window.api.file.openPath({ path })
    }

    const handleDownloadDocument = (path: string) => {
        window.api.file.download({ path })
    }

    if (!employee) return <></>

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

    return (
        <>
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

                        {/* Navigation Arrows - Using larger hit zones */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-12 pointer-events-none z-[110]">
                            <button
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
                                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                                disabled={!hasNext}
                                className={cn(
                                    "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto active:scale-90",
                                    hasNext ? "hover:bg-[#ffcc4d] hover:text-[#1e1e1e] text-white cursor-pointer" : "opacity-0 invisible"
                                )}
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-[#1e1e1e] w-full max-w-[1400px] rounded-[32px] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Close Button Mobile */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* LEFT SIDE: Profile & Key Info */}
                            <div className="w-full md:w-[350px] bg-black/20 border-r border-white/10 p-8 flex flex-col items-center text-center relative shrink-0 overflow-y-auto custom-scrollbar">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#ffcc4d]/10 to-transparent opacity-50"></div>

                                {/* Photo */}
                                <div className="relative mb-6 mt-4">
                                    <div className="w-40 h-40 rounded-[32px] p-2 bg-white/5 border border-white/10 shadow-2xl">
                                        {(() => {
                                            const isFemale = getIsFemale(employee.gender);
                                            const defaultIcon = `/icons/${isFemale ? 'female.png' : 'male.png'}`;
                                            return employee.photo ? (
                                                <img
                                                    src={getImageUrl(employee.photo)}
                                                    alt={employee.fullName}
                                                    className="w-full h-full object-cover rounded-[24px] bg-white/5"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).onerror = null;
                                                        (e.target as HTMLImageElement).src = defaultIcon;
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={getImageUrl(defaultIcon)}
                                                    alt={employee.fullName}
                                                    className="w-full h-full object-cover rounded-[24px] bg-white/5 opacity-80"
                                                />
                                            );
                                        })()}
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
                                <div className="w-full space-y-4 mb-4">
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
                            </div>

                            {/* MIDDLE: Details Grid */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#1e1e1e] relative border-r border-white/10">
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

                                {/* Document Generation Shortcuts - Only for Active Employees */}
                                {employee.status === 'En cours' && (
                                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center">

                                        <div className="flex flex-wrap justify-center gap-4">
                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Attestation de Travail",
                                                    content: <AttestationTravailDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        position={employee.function}
                                                        startDate={employee.dateEmbauche}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">A.Travail</span>
                                            </button>

                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Attestation de Salaire",
                                                    content: <AttestationSalaireDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        position={employee.function}
                                                        salary={employee.salary || 0}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">A.Salaire</span>
                                            </button>

                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Domiciliation de Crédit",
                                                    content: <DomiciliationCreditDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        rib={employee.rib || 'N/A'}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-400">Dom.Crédit</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Document Generation Shortcuts - Only for Departed Employees */}
                                {employee.status === 'Sortie' && (
                                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Générer Documents</p>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Lettre de Démission",
                                                    content: <DemissionDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        position={employee.function}
                                                        startDate={employee.dateEmbauche}
                                                        endDate={employee.dateSortie || ''}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-red-400">Démission</span>
                                            </button>

                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Solde de Tout Compte",
                                                    content: <STCDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        position={employee.function}
                                                        startDate={employee.dateEmbauche}
                                                        endDate={employee.dateSortie || ''}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-red-400">STC</span>
                                            </button>

                                            <button
                                                onClick={() => setPreviewDoc({
                                                    title: "Certificat de Travail",
                                                    content: <CertificatTravailDocument
                                                        fullName={employee.fullName}
                                                        cin={employee.cin}
                                                        position={employee.function}
                                                        startDate={employee.dateEmbauche}
                                                        endDate={employee.dateSortie || ''}
                                                        gender={employee.gender}
                                                    />
                                                })}
                                                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-red-400">C.Travail</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT SIDE: Documents List */}
                            <div className="w-full md:w-[320px] bg-black/20 p-8 flex flex-col relative shrink-0 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">Documents</h3>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">PDF Attachments</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all text-sm font-bold active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

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
                                                        onClick={() => handleOpenDocument(doc.path)}
                                                        className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center group/btn"
                                                        title="Open"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadDocument(doc.path)}
                                                        className="flex-1 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
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

            <PDFPreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                title={previewDoc?.title}
                docContent={previewDoc?.content || <></>}
                isHtml={true}
            />
        </>
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
