import { useState, useEffect } from 'react'
import { UserPlus, Search, ChevronDown, Building2, CheckCircle, FileText, Trash2 } from 'lucide-react'
import { EngagementDomicileDocument } from '../components/documents/EngagementDomicileDocument';
import ContratDocument from '../components/documents/ContratDocument';
import PDFPreviewModal from '../components/PDFPreviewModal';
import AddCandidateModal from '../components/AddCandidateModal'
import EditCandidateModal from '../components/EditCandidateModal'
import { useLanguage } from '../contexts/LanguageContext'

interface Candidate {
    id: string
    fullName: string
    nom?: string
    prenom?: string
    dateNaissance: string
    dateEmbauche: string
    address: string
    cin: string
    cnss: string
    gender: 'Male' | 'Female'
    salaireNet: string
    rib: string
    phone: string
    email: string
    contratPath: string
    engDomicilePath: string
    company: string
    function?: string
}

export default function RecruitmentPage(): JSX.Element {
    const { t } = useLanguage()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [selectedCompany, setSelectedCompany] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [candidateToValidate, setCandidateToValidate] = useState<Candidate | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
    const [previewDocument, setPreviewDocument] = useState<JSX.Element | null>(null)
    const [previewTitle, setPreviewTitle] = useState('')
    const [isPreviewHtml, setIsPreviewHtml] = useState(false)

    const fetchData = async () => {
        try {
            const dbCompanies = await window.api.db.getCompanies()
            setCompanies(dbCompanies.map(c => c.name))

            let currentCompany = selectedCompany
            if (dbCompanies.length > 0 && !selectedCompany) {
                currentCompany = dbCompanies[0].name
                setSelectedCompany(currentCompany)
            }

            if (currentCompany) {
                // @ts-ignore
                const dbCandidates = await window.api.db.getCandidates({ companyName: currentCompany })
                setCandidates(dbCandidates)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedCompany])

    const handleAdd = async (candidate: Candidate) => {
        try {
            if (candidate.contratPath && !candidate.contratPath.startsWith('/storage')) {
                // @ts-ignore
                candidate.contratPath = await window.api.file.saveCandidateDocument({
                    companyName: selectedCompany,
                    filePath: candidate.contratPath,
                    docType: 'contrat',
                    candidateId: candidate.id
                })
            }
            if (candidate.engDomicilePath && !candidate.engDomicilePath.startsWith('/storage')) {
                // @ts-ignore
                candidate.engDomicilePath = await window.api.file.saveCandidateDocument({
                    companyName: selectedCompany,
                    filePath: candidate.engDomicilePath,
                    docType: 'eng_domicile',
                    candidateId: candidate.id
                })
            }

            // @ts-ignore
            await window.api.db.addCandidate({ candidate, companyName: selectedCompany })

            await fetchData()
            setIsAddModalOpen(false)
        } catch (error) {
            console.error('Failed to add candidate:', error)
        }
    }

    const handleEdit = async (candidate: Candidate) => {
        try {
            if (candidate.contratPath && !candidate.contratPath.startsWith('/storage')) {
                // @ts-ignore
                candidate.contratPath = await window.api.file.saveCandidateDocument({
                    companyName: selectedCompany,
                    filePath: candidate.contratPath,
                    docType: 'contrat',
                    candidateId: candidate.id
                })
            }
            if (candidate.engDomicilePath && !candidate.engDomicilePath.startsWith('/storage')) {
                // @ts-ignore
                candidate.engDomicilePath = await window.api.file.saveCandidateDocument({
                    companyName: selectedCompany,
                    filePath: candidate.engDomicilePath,
                    docType: 'eng_domicile',
                    candidateId: candidate.id
                })
            }

            // @ts-ignore
            await window.api.db.deleteCandidate({ id: candidate.id, companyName: selectedCompany })
            // @ts-ignore
            await window.api.db.addCandidate({ candidate, companyName: selectedCompany })

            await fetchData()
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Failed to update candidate:', error)
        }
    }

    const handleValidate = async (candidate: Candidate) => {
        try {
            // @ts-ignore
            await window.api.db.validateCandidate({ candidate, companyName: selectedCompany })
            await fetchData()
            setCandidateToValidate(null)
        } catch (error) {
            console.error('Failed to validate candidate:', error)
            alert('Failed to validate candidate.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this candidate?')) return
        try {
            // @ts-ignore
            await window.api.db.deleteCandidate({ id, companyName: selectedCompany })
            await fetchData()
        } catch (error) {
            console.error('Failed to delete candidate:', error)
        }
    }

    const generateEngagementDomicile = async (candidate: Candidate) => {
        try {
            const doc = (
                <EngagementDomicileDocument
                    fullName={candidate.fullName}
                    cin={candidate.cin}
                    address={candidate.address}
                    gender={candidate.gender}
                />
            )
            setPreviewDocument(doc)
            setPreviewTitle(`Engagement Domicile - ${candidate.fullName}`)
            setIsPreviewHtml(true)
            setIsPdfPreviewOpen(true)
        } catch (error) {
            console.error("PDF Generation Error:", error)
            alert("Failed to generate PDF")
        }
    }

    const generateContract = async (candidate: Candidate) => {
        try {
            const fetchedCompanies = await window.api.db.getCompanies()
            const company = fetchedCompanies.find(c => c.name === selectedCompany)

            const doc = (
                <ContratDocument
                    employeeName={candidate.fullName.split(' ')[0] || ''}
                    employeeFirstName={candidate.fullName.split(' ').slice(1).join(' ') || ''}
                    cin={candidate.cin}
                    dateOfBirth={candidate.dateNaissance}
                    address={candidate.address}
                    position={candidate.function || 'Agent'}
                    startDate={candidate.dateEmbauche}
                    salary={candidate.salaireNet}
                    companyName={company?.name}
                    companyAddress={company?.address}
                    companyRC={company?.rc}
                    companyICE={company?.ice}
                    companyIF={company?.if_num}
                    companyRepresentative={company?.representant}
                    companyLogo={company?.logo}
                />
            )
            setPreviewDocument(doc)
            setPreviewTitle(`Contrat de Travail - ${candidate.fullName}`)
            setIsPreviewHtml(true)
            setIsPdfPreviewOpen(true)
        } catch (error) {
            console.error("Contract Generation Error:", error)
            alert("Failed to generate contract")
        }
    }

    const filteredCandidates = candidates.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )

    return (
        <div className="h-[calc(100vh-5rem)] w-full bg-[#141414] text-white p-6 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-b border-white/5 -mx-6 px-6 py-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Company Selector */}
                    <div className="relative group shrink-0 z-50">
                        <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-4 py-3 min-w-[200px] transition-all text-left">
                            <div className="p-2 bg-[#ffcc4d]/10 rounded-lg text-[#ffcc4d]">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('company')}</p>
                                <p className="text-sm font-bold text-white truncate">{selectedCompany}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                            {companies.map((company) => (
                                <button
                                    key={company}
                                    onClick={() => setSelectedCompany(company)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${selectedCompany === company ? 'bg-[#ffcc4d]/10 text-[#ffcc4d]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {company}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('searchCandidates')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-[#ffcc4d] hover:bg-[#ffcc4d]/90 text-black px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#ffcc4d]/20 active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('addCandidate')}</span>
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex-1 min-h-0">
                <div className="overflow-auto h-full custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1500px]">
                        <thead className="sticky top-0 z-10 bg-[#1e1e1e]">
                            <tr className="border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('nom')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('prenom')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('dateNaissance')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('gender')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('address')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('rib')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('cin')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('cnss')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('salaireNet')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('dateEmbauche')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('phone')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('email')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">{t('genDocs')}</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap sticky right-0 bg-[#1e1e1e] z-20 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCandidates.map((candidate) => (
                                <tr
                                    key={candidate.id}
                                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    onClick={() => { setSelectedCandidate(candidate); setIsEditModalOpen(true); }}
                                >
                                    <td className="p-4 font-bold text-white whitespace-nowrap group-hover:text-[#ffcc4d] transition-colors">{candidate.nom || candidate.fullName.split(' ')[0]}</td>
                                    <td className="p-4 text-slate-300 whitespace-nowrap">{candidate.prenom || candidate.fullName.split(' ').slice(1).join(' ')}</td>
                                    <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{candidate.dateNaissance}</td>
                                    <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3 h-3 opacity-50" />
                                            {candidate.gender}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300 max-w-[200px] truncate" title={candidate.address}>{candidate.address}</td>
                                    <td className="p-4 text-sm text-slate-300 font-mono whitespace-nowrap">{candidate.rib}</td>
                                    <td className="p-4 text-sm text-slate-300 font-mono whitespace-nowrap">{candidate.cin}</td>
                                    <td className="p-4 text-sm text-slate-300 font-mono whitespace-nowrap">{candidate.cnss}</td>
                                    <td className="p-4 text-sm text-[#ffcc4d] font-bold whitespace-nowrap">{candidate.salaireNet} DH</td>
                                    <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{candidate.dateEmbauche}</td>
                                    <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{candidate.phone}</td>
                                    <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{candidate.email}</td>

                                    {/* Generative Docs Buttons */}
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#ffcc4d] hover:text-black text-slate-400 transition-all border border-white/5 flex items-center gap-2 text-xs font-bold"
                                                title="Generate Contract"
                                                onClick={() => generateContract(candidate)}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Contrat
                                            </button>
                                            <button
                                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#ffcc4d] hover:text-black text-slate-400 transition-all border border-white/5 flex items-center gap-2 text-xs font-bold"
                                                title="Generate Eng. Domicile"
                                                onClick={() => generateEngagementDomicile(candidate)}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Eng. Domicile
                                            </button>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-right sticky right-0 bg-[#1e1e1e] group-hover:bg-[#222] transition-colors z-20 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setCandidateToValidate(candidate)}
                                                className="p-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg transition-all"
                                                title="Validate"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(candidate.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="p-12 text-center text-slate-500">
                                        <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p>{t('noCandidatesFound')} {selectedCompany}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddCandidateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAdd}
                defaultCompany={selectedCompany}
            />

            <EditCandidateModal
                isOpen={isEditModalOpen}
                candidate={selectedCandidate}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEdit}
                defaultCompany={selectedCompany}
            />

            {/* Validation Confirmation Modal */}
            {candidateToValidate && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-white mb-2">{t('confirmRecruitment')}</h3>
                        <p className="text-slate-400 text-center text-sm mb-8">
                            {t('recruitmentWarning')} <span className="text-white font-bold">{candidateToValidate.fullName}</span>
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setCandidateToValidate(null)}
                                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => handleValidate(candidateToValidate)}
                                className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PDFPreviewModal
                isOpen={isPdfPreviewOpen}
                onClose={() => setIsPdfPreviewOpen(false)}
                title={previewTitle}
                docContent={previewDocument || <></>}
                isHtml={isPreviewHtml}
            />
        </div>
    )
}
