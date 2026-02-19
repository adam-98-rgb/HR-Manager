import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Building2, Plus, Trash2, Edit2, Shield, Building, ChevronLeft, ChevronRight, Mail, User as UserIcon, Phone, MapPin, FileText, Upload, X, File, Download, Star } from 'lucide-react'
import { cn } from '../lib/utils'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

interface User {
    id: number
    name: string
    email: string
    role: 'Admin' | 'User'
    picture: string
    gender: 'Male' | 'Female'
    phone?: string
}

interface Company {
    id: number
    name: string
    logo: string
    address?: string
    ice?: string
    if_num?: string
    cnss?: string
    rc?: string
    representant?: string
}

interface CompanyDocument {
    id: number
    company_id: number
    name: string
    path: string
    upload_date: string
}

export default function SettingsPage({ currentUser }: { currentUser: any }) {
    const [users, setUsers] = useState<User[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCompanyIndex, setActiveCompanyIndex] = useState(0)
    const [documents, setDocuments] = useState<CompanyDocument[]>([])
    const [loadingDocs, setLoadingDocs] = useState(false)

    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean
        type: 'user' | 'company' | 'document' | 'document_manager' | 'assurance'
        id: number
        name: string
    }>({ isOpen: false, type: 'user', id: 0, name: '' })

    // Form States
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'User', gender: 'Male', phone: '', picture: '', companyIds: [] as number[] })
    const [companyForm, setCompanyForm] = useState<any>({ name: '', address: '', ice: '', if_num: '', cnss: '', rc: '', representant: '', logo: '' })

    // Assurance State
    const [assuranceCompanies, setAssuranceCompanies] = useState<any[]>([])
    const [isAssuranceModalOpen, setIsAssuranceModalOpen] = useState(false)
    const [assuranceForm, setAssuranceForm] = useState({ name: '', logo: '', phone: '', email: '' })


    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (companies.length > 0) {
            fetchDocuments(companies[activeCompanyIndex].id)
        } else {
            setDocuments([])
        }
    }, [activeCompanyIndex, companies])

    const fetchData = async () => {
        setLoading(true)
        try {
            // @ts-ignore
            const [usersResult, companiesResult, assuranceResult] = await Promise.allSettled([
                // @ts-ignore
                window.api.db.getUsers(),
                // @ts-ignore
                window.api.db.getCompanies(),
                // @ts-ignore
                window.api.db.getAssuranceCompanies()
            ])
            if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
            if (companiesResult.status === 'fulfilled') setCompanies(companiesResult.value)
            if (assuranceResult.status === 'fulfilled') setAssuranceCompanies(assuranceResult.value)
        } catch (error) {
            console.error('Failed to fetch settings data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDocuments = async (companyId: number) => {
        setLoadingDocs(true)
        try {
            // @ts-ignore
            const docs = await window.api.db.getCompanyDocuments(companyId)
            setDocuments(docs)
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        } finally {
            setLoadingDocs(false)
        }
    }

    const nextCompany = () => {
        setActiveCompanyIndex(prev => (prev + 1) % companies.length)
    }

    const prevCompany = () => {
        setActiveCompanyIndex(prev => (prev - 1 + companies.length) % companies.length)
    }

    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                // @ts-ignore
                await window.api.db.updateUser(editingUser.id, userForm)
                // @ts-ignore
                await window.api.db.updateUserCompanies(editingUser.id, userForm.companyIds)
            } else {
                // @ts-ignore
                const userId = await window.api.db.createUser(userForm)
                // @ts-ignore
                await window.api.db.updateUserCompanies(userId, userForm.companyIds)
            }
            setIsUserModalOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to save user:', error)
        }
    }

    const confirmDelete = async () => {
        try {
            if (deleteModal.type === 'user') {
                // @ts-ignore
                await window.api.db.deleteUser(deleteModal.id)
                fetchData() // Refresh users
            } else if (deleteModal.type === 'company') {
                // @ts-ignore
                await window.api.db.deleteCompany({ id: deleteModal.id, name: deleteModal.name })
                fetchData() // Refresh companies
            } else if (deleteModal.type === 'document') {
                // @ts-ignore
                await window.api.db.deleteCompanyDocument(deleteModal.id)
                if (companies.length > 0) fetchDocuments(companies[activeCompanyIndex].id) // Refresh docs
            } else if (deleteModal.type === 'assurance') {
                // @ts-ignore
                await window.api.db.deleteAssuranceCompany(deleteModal.id)
                fetchData()
            }
            setDeleteModal({ ...deleteModal, isOpen: false })
        } catch (error) {
            console.error(`Failed to delete ${deleteModal.type}: `, error)
        }
    }

    const handleDeleteUser = (user: User) => {
        if (user.id === currentUser.id) return
        setDeleteModal({
            isOpen: true,
            type: 'user',
            id: user.id,
            name: user.name
        })
    }

    const handleSaveCompany = async () => {
        try {
            if (editingCompany) {
                // @ts-ignore
                await window.api.db.updateCompany(editingCompany.id, companyForm)
            } else {
                // @ts-ignore
                await window.api.db.addCompany(companyForm)
            }
            setIsCompanyModalOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to save company:', error)
        }
    }

    const handleDeleteCompany = (company: Company) => {
        setDeleteModal({
            isOpen: true,
            type: 'company',
            id: company.id,
            name: company.name
        })
    }

    const handleOpenDocument = (path: string) => {
        // @ts-ignore
        window.api.db.openPath(path)
    }

    const handleUploadDocument = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const file = files[0]
        const lower = file.name.toLowerCase() // Or file.path logic below if needed

        if (!lower.endsWith('.pdf') && !lower.endsWith('.doc') && !lower.endsWith('.docx')) {
            alert('Only PDF and Word documents are allowed.')
            return
        }

        const company = companies[activeCompanyIndex]
        if (!company) return

        try {
            // @ts-ignore
            const savedPath = await window.api.db.saveCompanyDocument(company.name, file.path)
            // @ts-ignore
            await window.api.db.addCompanyDocument(company.id, file.name, savedPath)
            fetchDocuments(company.id)
        } catch (error) {
            console.error('Failed to upload document:', error)
        }
    }

    const handleDeleteDocument = (doc: CompanyDocument) => {
        setDeleteModal({
            isOpen: true,
            type: 'document',
            id: doc.id,
            name: doc.name
        })
    }

    const openAddUserModal = () => {
        setEditingUser(null)
        setUserForm({ name: '', email: '', password: '', role: 'User', gender: 'Male', phone: '', picture: '', companyIds: [] })
        setIsUserModalOpen(true)
    }

    const openAddCompanyModal = () => {
        setEditingCompany(null)
        setCompanyForm({ name: '', address: '', ice: '', if_num: '', cnss: '', rc: '', representant: '', logo: '' })
        setIsCompanyModalOpen(true)
    }

    const handleSaveAssurance = async () => {
        try {
            // @ts-ignore
            await window.api.db.addAssuranceCompany(assuranceForm)
            setIsAssuranceModalOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to save assurance company:', error)
        }
    }

    const handleSetDefaultAssurance = async (id: number) => {
        try {
            // @ts-ignore
            await window.api.db.setDefaultAssuranceCompany({ id })
            fetchData()
        } catch (error) {
            console.error('Failed to set default assurance company:', error)
        }
    }

    // Drag and Drop handlers
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        handleUploadDocument(e.dataTransfer.files)
    }

    const isAdmin = currentUser.role === 'Admin'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-[#ffcc4d] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const otherUsers = users.filter(u => u.id !== currentUser.id)

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col relative bg-[#0a0a0a]">
            {/* Yellow ambient background */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#ffcc4d] opacity-[0.03] blur-[150px] pointer-events-none rounded-full z-0" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#ffcc4d] opacity-[0.02] blur-[150px] pointer-events-none rounded-full z-0" />

            {/* Header */}
            <h1 className="text-3xl font-bold text-white mb-8 font-['Outfit'] relative z-10 w-fit">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 relative z-10">
                {/* 1. Current User Profile Card */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#141414]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden h-full flex flex-col items-center text-center">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#ffcc4d]/10 to-transparent" />

                        <div className="w-32 h-32 rounded-full border-4 border-[#141414] shadow-xl relative z-10 mb-4 overflow-hidden bg-white/5 group relative">
                            <img
                                src={currentUser.picture || (currentUser.gender === 'Female' ? '/icons/female.png' : '/icons/male.png')}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails (e.g. invalid path), though gender defaults should exist
                                    e.currentTarget.src = currentUser.gender === 'Female' ? '/icons/female.png' : '/icons/male.png'
                                }}
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
                        <span className="px-3 py-1 bg-[#ffcc4d]/20 text-[#ffcc4d] rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-[#ffcc4d]/20">
                            {currentUser.role}
                        </span>

                        <div className="w-full space-y-4 text-left bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-xl text-slate-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Email</p>
                                    <p className="text-white font-medium truncate" title={currentUser.email}>{currentUser.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-xl text-slate-400">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Gender</p>
                                    <p className="text-white font-medium">{currentUser.gender}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-xl text-slate-400">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Phone</p>
                                    <p className="text-white font-medium">{currentUser.phone || 'Not set'}</p>
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditingUser(currentUser)
                                    // @ts-ignore
                                    window.api.db.getUserCompanies(currentUser.id).then(ids => {
                                        setUserForm({ ...currentUser, password: '', companyIds: ids, phone: currentUser.phone || '', picture: currentUser.picture || '' })
                                        setIsUserModalOpen(true)
                                    })
                                }}
                                className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/5 flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Company Carousel - Enhanced */}
                <div className="lg:col-span-8">
                    {companies.length > 0 ? (
                        <div className="bg-[#141414]/90 backdrop-blur-3xl rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#ffcc4d]/5 to-transparent opacity-50 pointer-events-none" />

                            <div className="flex justify-between items-center mb-6 z-10 relative">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-[#ffcc4d]/10 rounded-lg">
                                        <Building className="w-6 h-6 text-[#ffcc4d]" />
                                    </div>
                                    Company Details
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={prevCompany} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/20 shadow-lg">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button onClick={nextCompany} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/20 shadow-lg">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 rounded-[28px] overflow-hidden flex flex-col md:flex-row gap-8 relative z-10">
                                {/* Left Column: Info (70%) */}
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="flex items-center gap-6 mb-2">
                                        <div className="w-24 h-24 bg-[#0a0a0a] rounded-2xl flex items-center justify-center p-3 border border-white/5 shadow-xl relative overflow-hidden shrinkage-0">
                                            {companies[activeCompanyIndex].logo ? (
                                                <img src={companies[activeCompanyIndex].logo} className="w-full h-full object-contain relative z-10" />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-slate-700 relative z-10" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{companies[activeCompanyIndex].name}</h2>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                                <MapPin className="w-4 h-4 text-[#ffcc4d]" />
                                                {companies[activeCompanyIndex].address || 'No Address Provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-[#ffcc4d]/30 transition-colors group/card">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 group-hover/card:text-[#ffcc4d] transition-colors">ICE Identifier</p>
                                            <p className="text-white font-mono text-lg tracking-wide">{companies[activeCompanyIndex].ice || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-[#ffcc4d]/30 transition-colors group/card">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 group-hover/card:text-[#ffcc4d] transition-colors">N° RC</p>
                                            <p className="text-white font-mono text-lg tracking-wide">{companies[activeCompanyIndex].rc || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-[#ffcc4d]/30 transition-colors group/card">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 group-hover/card:text-[#ffcc4d] transition-colors">CNSS Number</p>
                                            <p className="text-white font-mono text-lg tracking-wide">{companies[activeCompanyIndex].cnss || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-[#ffcc4d]/30 transition-colors group/card">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 group-hover/card:text-[#ffcc4d] transition-colors">Tax ID (IF)</p>
                                            <p className="text-white font-mono text-lg tracking-wide">{companies[activeCompanyIndex].if_num || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-[#ffcc4d]/30 transition-colors group/card">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 group-hover/card:text-[#ffcc4d] transition-colors">Legal Representative</p>
                                            <p className="text-white font-medium text-lg truncate" title={companies[activeCompanyIndex].representant}>{companies[activeCompanyIndex].representant || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {/* Edit button moved to sidebar */}
                                    </div>
                                </div>

                                {/* Right Column: Documents (30%) */}
                                <div className="w-full md:w-[35%] flex flex-col gap-4 border-l border-white/5 pl-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Documents
                                        </h3>
                                        {isAdmin && (
                                            <button
                                                onClick={() => {
                                                    fetchDocuments(companies[activeCompanyIndex].id)
                                                    setDeleteModal({ ...deleteModal, isOpen: true, type: 'document_manager', id: companies[activeCompanyIndex].id, name: companies[activeCompanyIndex].name } as any)
                                                }}
                                                className="p-2 bg-[#ffcc4d] text-black rounded-lg hover:bg-[#ffdb80] transition-colors shadow-lg shadow-[#ffcc4d]/20"
                                                title="Add / Manage Documents"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Document List (Read-only view) */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[250px] pr-2">
                                        {loadingDocs ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="w-4 h-4 border-2 border-[#ffcc4d] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : documents.length > 0 ? (
                                            documents.map(doc => {
                                                const isPdf = doc.name.toLowerCase().endsWith('.pdf')
                                                return (
                                                    <div
                                                        key={doc.id}
                                                        className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 hover:border-white/20 transition-all group/doc flex items-center gap-3 cursor-pointer"
                                                        onClick={() => handleOpenDocument(doc.path)}
                                                    >
                                                        <div className={cn("p-2 rounded-lg shrink-0", isPdf ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="overflow-hidden min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-white truncate group-hover/doc:text-[#ffcc4d] transition-colors" title={doc.name}>{doc.name}</p>
                                                            <p className="text-[10px] text-slate-600 truncate">{new Date(doc.upload_date).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    // @ts-ignore
                                                                    window.api.db.downloadDocument(doc.path)
                                                                }}
                                                                className="p-1.5 text-slate-500 hover:text-[#ffcc4d] hover:bg-[#ffcc4d]/10 rounded-md transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteDocument(doc)
                                                                    }}
                                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                                    title="Delete Document"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                                                <p className="text-slate-500 text-xs">No documents</p>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setDeleteModal({ ...deleteModal, isOpen: true, type: 'document_manager', id: companies[activeCompanyIndex].id, name: companies[activeCompanyIndex].name } as any)}
                                                        className="text-[#ffcc4d] text-xs font-bold mt-2 hover:underline"
                                                    >
                                                        Upload one?
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#141414] rounded-[32px] p-8 border border-white/5 shadow-2xl h-full flex items-center justify-center text-slate-500">
                            No companies added yet.
                        </div>
                    )}
                </div>

                {/* 3. Users Table */}
                <div className="lg:col-span-4">
                    <div className="bg-[#141414]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 shadow-2xl h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#ffcc4d]" />
                                Other Users
                            </h3>
                            {isAdmin && (
                                <button onClick={openAddUserModal} className="px-4 py-2 bg-[#ffcc4d] text-black font-bold rounded-xl flex items-center gap-2 text-sm hover:bg-[#ffdb80] shadow-lg shadow-[#ffcc4d]/20 transition-transform hover:scale-105">
                                    <Plus className="w-4 h-4" /> Add User
                                </button>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        {isAdmin && <th className="p-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {otherUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                                        <img
                                                            src={user.picture || (user.gender === 'Female' ? '/icons/female.png' : '/icons/male.png')}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.src = user.gender === 'Female' ? '/icons/female.png' : '/icons/male.png' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{user.name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                    user.role === 'Admin' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(user)
                                                                // @ts-ignore
                                                                window.api.db.getUserCompanies(user.id).then(ids => {
                                                                    setUserForm({ ...user, password: '', companyIds: ids, phone: user.phone || '', picture: user.picture || '' })
                                                                    setIsUserModalOpen(true)
                                                                })
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {otherUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-500">
                                                No other users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 5. Assurance Companies Card (Centered) */}
                <div className="lg:col-span-4">
                    <div className="bg-[#141414]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 shadow-2xl h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-400" />
                                Assurance Companies
                            </h3>
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        setAssuranceForm({ name: '', logo: '', phone: '', email: '' })
                                        setIsAssuranceModalOpen(true)
                                    }}
                                    className="p-2 bg-[#f5f5f5] text-black rounded-lg hover:bg-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
                            {assuranceCompanies.map((company) => (
                                <div key={company.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1.5 border border-white/5">
                                            {company.logo ? <img src={company.logo} className="w-full h-full object-contain" /> : <Shield className="w-5 h-5 text-slate-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{company.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{company.phone}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                <span>{company.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleSetDefaultAssurance(company.id)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    company.is_default
                                                        ? "text-[#ffcc4d] bg-[#ffcc4d]/10"
                                                        : "text-slate-400 hover:text-[#ffcc4d] hover:bg-[#ffcc4d]/10"
                                                )}
                                                title={company.is_default ? "Default carrier" : "Set as default"}
                                            >
                                                <Star className={cn("w-4 h-4", company.is_default && "fill-[#ffcc4d]")} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteModal({
                                                        isOpen: true,
                                                        type: 'assurance',
                                                        id: company.id,
                                                        name: company.name
                                                    } as any)
                                                }}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {assuranceCompanies.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    No assurance companies added.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Companies List (Minimal) */}
                <div className="lg:col-span-4">
                    <div className="bg-[#141414]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 shadow-2xl h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-purple-400" />
                                Companies List
                            </h3>
                            {isAdmin && (
                                <button onClick={openAddCompanyModal} className="p-2 bg-[#f5f5f5] text-black rounded-lg hover:bg-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
                            {companies.map((company, index) => (
                                <div
                                    key={company.id}
                                    onClick={() => setActiveCompanyIndex(index)}
                                    className={cn(
                                        "p-4 rounded-2xl flex items-center justify-between border cursor-pointer transition-all group",
                                        activeCompanyIndex === index
                                            ? "bg-white/10 border-[#ffcc4d]/50 shadow-[0_0_15px_-5px_#ffcc4d]"
                                            : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1.5 border border-white/5">
                                            {company.logo ? <img src={company.logo} className="w-full h-full object-contain" /> : <Building className="w-5 h-5 text-slate-500" />}
                                        </div>
                                        <p className={cn("font-bold text-sm", activeCompanyIndex === index ? "text-white" : "text-slate-300")}>{company.name}</p>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingCompany(company)
                                                    setCompanyForm(company)
                                                    setIsCompanyModalOpen(true)
                                                }}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                title="Edit Company"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteCompany(company)
                                                }}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                title="Delete Company"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen && deleteModal.type !== 'document_manager'} // Hack for now, better to separate states
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title={`Delete ${deleteModal.type === 'user' ? 'User' : deleteModal.type === 'company' ? 'Company' : 'Document'} `}
                message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
                itemName={deleteModal.name}
            />

            {/* Document Manager Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && deleteModal.type === 'document_manager' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="absolute inset-0" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[#ffcc4d]" />
                                Manage Documents
                                <span className="text-sm font-normal text-slate-500 ml-auto bg-white/5 py-1 px-3 rounded-lg border border-white/5">{companies[activeCompanyIndex]?.name}</span>
                            </h2>

                            {/* Drop Zone */}
                            <div
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                onClick={async () => {
                                    // @ts-ignore
                                    const file = await window.api.db.selectFile([{ name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }])
                                    if (file) {
                                        const fakeFileList = [{
                                            path: file,
                                            name: file.split(/[/\\]/).pop()
                                        }]
                                        // @ts-ignore
                                        handleUploadDocument(fakeFileList)
                                    }
                                }}
                                className="border-2 border-dashed border-white/10 bg-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.08] hover:border-[#ffcc4d]/30 transition-all group/drop mb-8"
                            >
                                <Upload className="w-10 h-10 text-slate-500 mb-4 group-hover/drop:text-[#ffcc4d] transition-colors" />
                                <p className="text-sm text-white font-bold">Drag & Drop or Click to Upload</p>
                                <p className="text-xs text-slate-500 mt-2">Supported formats: .pdf, .doc, .docx</p>
                            </div>

                            {/* Document List */}
                            <div className="flex-1 space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Uploaded Documents</h3>
                                {loadingDocs ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-[#ffcc4d] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : documents.length > 0 ? (
                                    documents.map(doc => {
                                        const isPdf = doc.name.toLowerCase().endsWith('.pdf')
                                        return (
                                            <div key={doc.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all group/doc flex items-center justify-between">
                                                <div
                                                    className="flex items-center gap-4 overflow-hidden cursor-pointer flex-1"
                                                    onClick={() => handleOpenDocument(doc.path)}
                                                >
                                                    <div className={cn("p-2 rounded-lg", isPdf ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500")}>
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-white truncate group-hover/doc:text-[#ffcc4d] transition-colors text-sm">{doc.name}</p>
                                                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                            <span className="uppercase">{isPdf ? 'PDF' : 'WORD'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // We need a way to confirm delete from inside this modal, or just do it direct?
                                                        // Let's do direct for speed or reuse delete modal on top? Reusing might be tricky with z-index.
                                                        // For now, simple confirm
                                                        if (confirm('Delete this document?')) {
                                                            // @ts-ignore
                                                            window.api.db.deleteCompanyDocument(doc.id).then(() => fetchDocuments(companies[activeCompanyIndex].id))
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover/doc:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                        <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* User Modal */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-white mb-6">{editingUser ? 'Edit User' : 'Add User'}</h2>
                            <div className="space-y-4">
                                {/* Profile Picture Selector */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                                        onClick={async () => {
                                            // @ts-ignore
                                            const result = await window.api.db.selectAndCopy()
                                            if (result) {
                                                // Store original path for DB saving (will be handled by main process)
                                                // But show preview path for immediate UI feedback
                                                // setUserForm({ ...userForm, picture: result.originalPath })

                                                // Force update preview manually or we need a separate state?
                                                // Since we bind src to userForm.picture, and userForm.picture is now originalPath (absolute), it will fail CSP.
                                                // We need to handle this.
                                                // Hack: Set it to previewPath temporarly? 
                                                // But main process expects originalPath to copy it. 
                                                // If we pass previewPath (/storage/temp/...), main process check `!startsWith('/storage')` will fail and it won't copy.
                                                // Actually, main process checks `!startsWith('/storage')`. previewPath STARTS with /storage.
                                                // So main process will SKIP copying.
                                                // And save /storage/temp/... to DB.
                                                // This is fine, but temp might be messy.
                                                // Let's use previewPath for now. It works and is simpler.
                                                setUserForm({ ...userForm, picture: result.previewPath })
                                            }
                                        }}
                                    >
                                        <img
                                            src={userForm.picture || (userForm.gender === 'Female' ? '/icons/female.png' : '/icons/male.png')}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = userForm.gender === 'Female' ? '/icons/female.png' : '/icons/male.png' }}
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm">Profile Picture</p>
                                        <p className="text-slate-500 text-xs mt-1">Click to upload a new picture</p>
                                        {userForm.picture && (
                                            <button onClick={(e) => { e.stopPropagation(); setUserForm({ ...userForm, picture: '' }) }} className="text-red-400 text-xs mt-2 hover:underline">Remove Picture</button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Name" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                                    <input placeholder="Email" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Phone" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
                                    <select
                                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d] [&>option]:bg-[#1e1e1e]"
                                        value={userForm.gender}
                                        onChange={e => setUserForm({ ...userForm, gender: e.target.value as 'Male' | 'Female' })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <input placeholder="Password (leave blank to keep)" type="password" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => setUserForm({ ...userForm, role: 'User' })} className={cn("flex-1 py-2 rounded-xl border text-sm font-bold transition-all", String(userForm.role) === 'User' ? "bg-[#ffcc4d] text-black border-[#ffcc4d]" : "bg-white/5 border-white/10 text-slate-400")}>User</button>
                                        <button onClick={() => setUserForm({ ...userForm, role: 'Admin' })} className={cn("flex-1 py-2 rounded-xl border text-sm font-bold transition-all", String(userForm.role) === 'Admin' ? "bg-[#ffcc4d] text-black border-[#ffcc4d]" : "bg-white/5 border-white/10 text-slate-400")}>Admin</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Assigned Companies</label>
                                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-white/5 p-2 rounded-xl border border-white/5 custom-scrollbar">
                                        {companies.map(company => (
                                            <label key={company.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={userForm.companyIds.includes(company.id)}
                                                    onChange={(e) => {
                                                        const ids = e.target.checked
                                                            ? [...userForm.companyIds, company.id]
                                                            : userForm.companyIds.filter(id => id !== company.id)
                                                        setUserForm({ ...userForm, companyIds: ids })
                                                    }}
                                                    className="rounded border-white/20 bg-white/10 text-[#ffcc4d] focus:ring-[#ffcc4d]"
                                                />
                                                <span className="text-sm text-white">{company.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsUserModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={handleSaveUser} className="flex-1 py-3 rounded-xl bg-[#ffcc4d] text-black font-bold hover:bg-[#ffcc4d]/90 transition-colors">Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Company Modal */}
            <AnimatePresence>
                {isCompanyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-white mb-6">{editingCompany ? 'Edit Company' : 'Add Company'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Company Name</label>
                                    <input placeholder="Company Name" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Address</label>
                                    <input placeholder="Address" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">ICE</label>
                                        <input placeholder="ICE" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.ice} onChange={e => setCompanyForm({ ...companyForm, ice: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">IF</label>
                                        <input placeholder="IF" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.if_num} onChange={e => setCompanyForm({ ...companyForm, if_num: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">CNSS</label>
                                        <input placeholder="CNSS" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.cnss} onChange={e => setCompanyForm({ ...companyForm, cnss: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">N° RC</label>
                                        <input placeholder="N° RC" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.rc} onChange={e => setCompanyForm({ ...companyForm, rc: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Representant</label>
                                        <input placeholder="Representant" className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full focus:outline-none focus:border-[#ffcc4d]" value={companyForm.representant} onChange={e => setCompanyForm({ ...companyForm, representant: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Logo</label>
                                    <button
                                        onClick={async () => {
                                            // @ts-ignore
                                            const result = await window.api.db.selectAndCopy()
                                            if (result) setCompanyForm({ ...companyForm, logo: result.previewPath })
                                        }}
                                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex justify-between items-center hover:bg-white/10 transition-colors"
                                    >
                                        <span className={companyForm.logo ? "text-white" : "text-slate-500"}>{companyForm.logo ? (companyForm.logo.split(/[/\\]/).pop()) : "Select Logo"}</span>
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={handleSaveCompany} className="flex-1 py-3 rounded-xl bg-[#ffcc4d] text-black font-bold hover:bg-[#ffcc4d]/90 transition-colors">Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Assurance Company Modal */}
            <AnimatePresence>
                {isAssuranceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="absolute inset-0" onClick={() => setIsAssuranceModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-md border border-white/10 relative z-10"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Add Assurance Company</h2>
                            <div className="space-y-4">
                                <div className="flex justify-center mb-6">
                                    <div
                                        onClick={async () => {
                                            // @ts-ignore
                                            const file = await window.api.db.selectFile([{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }])
                                            if (file) {
                                                // @ts-ignore
                                                const savedPath = await window.api.db.saveCompanyDocument('assurance_logos', file) // Reuse save doc logic, or cleaner separate logic
                                                setAssuranceForm({ ...assuranceForm, logo: savedPath })
                                            }
                                        }}
                                        className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#ffcc4d] hover:bg-white/10 transition-all overflow-hidden relative group"
                                    >
                                        {assuranceForm.logo ? (
                                            <img src={assuranceForm.logo} className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-[#ffcc4d]" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company Name</label>
                                    <input
                                        type="text"
                                        value={assuranceForm.name}
                                        onChange={(e) => setAssuranceForm({ ...assuranceForm, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffcc4d] transition-colors"
                                        placeholder="e.g. AXA Assurance"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                                    <input
                                        type="text"
                                        value={assuranceForm.phone}
                                        onChange={(e) => setAssuranceForm({ ...assuranceForm, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffcc4d] transition-colors"
                                        placeholder="+212 ..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={assuranceForm.email}
                                        onChange={(e) => setAssuranceForm({ ...assuranceForm, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffcc4d] transition-colors"
                                        placeholder="contact@company.com"
                                    />
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => setIsAssuranceModalOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAssurance}
                                        className="flex-1 py-3 bg-[#ffcc4d] text-black rounded-xl font-bold hover:bg-[#ffdb80] transition-colors shadow-lg shadow-[#ffcc4d]/20"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
