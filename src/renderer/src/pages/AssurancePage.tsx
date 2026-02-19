import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Edit, Trash2, X, Filter, Search, Save, Users, User, ChevronRight, Building2, AlertCircle, FileText, Calendar, DollarSign, Briefcase, Check, Paperclip, Tag, CreditCard, ChevronDown, Printer } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface AssuranceRecord {
    id: number
    assure: string
    beneficiaire: string
    dossier_num: string
    date_declaration: string
    date_depot: string
    montant: number
    type: string
    company: string
    date_remboursement: string
    montant_rembourse: number
    taux: number
    status: string // 'En cours', 'Remboursé', 'Rejeté'
    numAffiliation: string
    documents_joints?: string[]
    employer?: string
    idStr?: string
}

interface Employee {
    id: string
    fullName: string
    company: string
    gender?: string
    cnss?: string
    situation?: string
    conjoint?: string
    child1?: string
    child2?: string
    child3?: string
    child4?: string
    adhesionStatus?: string
    status: string
}

export default function AssurancePage(): JSX.Element {
    const { t } = useLanguage()
    const [records, setRecords] = useState<AssuranceRecord[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
    const [filteredRecords, setFilteredRecords] = useState<AssuranceRecord[]>([])

    // Derived Data for Filters
    const [availableYears, setAvailableYears] = useState<string[]>([])
    const availableDepositDates = Array.from(new Set(
        filteredRecords
            .map(r => r.date_depot)
            .filter(Boolean)
    )).sort().reverse()

    // Filters State
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [searchTerm, setSearchTerm] = useState('')

    // Advanced Filters
    const [filterEmployerCompany, setFilterEmployerCompany] = useState<string>('All')
    const [filterInsuranceCompany, setFilterInsuranceCompany] = useState<string>('All')
    const [filterYear, setFilterYear] = useState<string>('All')
    const [filterType, setFilterType] = useState<string>('All')

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentRecord, setCurrentRecord] = useState<AssuranceRecord | null>(null)

    // ADD THESE TWO NEW STATE VARIABLES HERE 👇
    const [showNonAdherentWarning, setShowNonAdherentWarning] = useState(false)
    const [pendingEmployee, setPendingEmployee] = useState<any>(null)

    // Side Panel State
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [sidePanelLoading, setSidePanelLoading] = useState(false)
    const [familyData, setFamilyData] = useState<Partial<Employee>>({})

    const [formData, setFormData] = useState<Partial<AssuranceRecord>>({})
    const [selectedDocument, setSelectedDocument] = useState('')
    const [showSuccessToast, setShowSuccessToast] = useState(false)
    const [highlightedId, setHighlightedId] = useState<number | null>(null)
    const [amountText, setAmountText] = useState('')

    // Evaluate arithmetic expressions like "300+200"
    const evaluateArithmetic = (str: string): number => {
        if (!str) return 0
        // Only allow numbers, plus sign, and dots
        const sanitized = str.replace(/[^0-9+\.]/g, '')
        try {
            // Split by + and sum up the parts
            return sanitized.split('+')
                .map(part => parseFloat(part))
                .filter(val => !isNaN(val))
                .reduce((a, b) => a + b, 0)
        } catch (e) {
            return 0
        }
    }

    // Autocomplete States
    const [assureSearch, setAssureSearch] = useState('')
    const [showAssureDropdown, setShowAssureDropdown] = useState(false)
    const [familyOptions, setFamilyOptions] = useState<string[]>([])

    // Constants
    const insuranceTypes = [
        { key: 'health', value: t('health') },
        { key: 'dental', value: t('dental') },
        { key: 'optical', value: t('optical') },
        { key: 'complement', value: t('complement') },
        { key: 'dentalQuote', value: t('dentalQuote') },
        { key: 'medicalQuote', value: t('medicalQuote') },
        { key: 'newEng', value: t('newEng') },
        { key: 'engCorrection', value: t('engCorrection') }
    ]

    const documentTypes = [
        { key: 'invoice', value: t('invoice') },
        { key: 'prescription', value: t('prescription') },
        { key: 'slip', value: t('slip') },
        { key: 'quote', value: t('quote') },
        { key: 'medicalReport', value: t('medicalReport') },
        { key: 'radioEcho', value: t('radioEcho') },
        { key: 'labTests', value: t('labTests') },
        { key: 'supportAgreement', value: t('supportAgreement') },
        { key: 'medication', value: t('medication') },
        { key: 'other', value: t('other') }
    ]

    const getTranslatedType = (type: string) => {
        if (!type) return '-';
        const found = insuranceTypes.find(it => it.key === type || it.value === type ||
            (type === 'Maladie' && it.key === 'health') ||
            (type === 'Dentaire' && it.key === 'dental') ||
            (type === 'Optique' && it.key === 'optical') ||
            (type === 'Complément' && it.key === 'complement') ||
            (type === 'Devis Dentaire' && it.key === 'dentalQuote') ||
            (type === 'Devis Médical' && it.key === 'medicalQuote') ||
            (type === 'Nv Adh' && it.key === 'newEng') ||
            (type === 'Adh rectificatif' && it.key === 'engCorrection')
        );
        return found ? found.value : type;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const sortRecordsByDateDecl = (recordsToSort: AssuranceRecord[]) => {
        return [...recordsToSort].sort((a, b) => {
            // Sort by date_declaration descending (newest first)
            const dateA = a.date_declaration || ''
            const dateB = b.date_declaration || ''
            if (dateA !== dateB) return dateB.localeCompare(dateA)
            // If same date, sort by ID descending (newest ID first)
            return b.id - a.id
        })
    }

    const fetchData = async () => {
        try {
            if (!window.api?.db?.getCompanies) {
                console.error('API not ready')
                return
            }
            const dbCompanies = await window.api.db.getCompanies()
            setCompanies(dbCompanies.map(c => c.name))

            const dbInsuranceCompanies = await window.api.db.getAssuranceCompanies()
            setInsuranceCompanies(dbInsuranceCompanies || [])

            const data = await window.api.db.getAssurances({})
            const parsedData = (data || []).map((r: any) => ({
                ...r,
                documents_joints: typeof r.documents_joints === 'string'
                    ? JSON.parse(r.documents_joints || '[]')
                    : (r.documents_joints || [])
            }))

            // Sort by date_declaration descending
            const sortedData = sortRecordsByDateDecl(parsedData)

            console.log('Fetched data, total records:', sortedData.length)
            setRecords(sortedData)

            const years = Array.from(new Set(parsedData.map(r => r.date_declaration ? r.date_declaration.substring(0, 4) : ''))).filter(Boolean).sort().reverse()
            setAvailableYears(years)

            // Set default carrier as initial filter if not already set
            const defaultCarrier = dbInsuranceCompanies?.find(c => c.is_default === 1)
            if (defaultCarrier && filterInsuranceCompany === 'All') {
                setFilterInsuranceCompany(defaultCarrier.name)
            }

        } catch (error) {
            console.error('Failed to fetch assurance data:', error)
        }
    }

    const loadAllEmployees = async () => {
        setSidePanelLoading(true)
        try {
            console.log('Loading assurance employees...')
            const employees = await window.api.db.getAssuranceEmployees()
            console.log('Total assurance employees loaded:', employees.length, employees)
            setAllEmployees(employees)
        } catch (error) {
            console.error("Error loading assurance employees", error)
        } finally {
            setSidePanelLoading(false)
        }
    }

    // --- Side Panel Logic & Master Data ---
    const [allEmployees, setAllEmployees] = useState<any[]>([])
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
        loadAllEmployees() // Load employees on mount
    }, [])

    useEffect(() => {
        let result = records

        if (filterEmployerCompany !== 'All') {
            result = result.filter(r => r.employer === filterEmployerCompany)
        }

        if (filterInsuranceCompany !== 'All') {
            result = result.filter(r => r.company === filterInsuranceCompany)
        }

        if (filterYear !== 'All') {
            result = result.filter(r => r.date_declaration.startsWith(filterYear))
        }

        if (filterType !== 'All') {
            result = result.filter(r => r.type === filterType)
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            result = result.filter(r =>
                r.assure.toLowerCase().includes(lowerTerm) ||
                (r.beneficiaire && r.beneficiaire.toLowerCase().includes(lowerTerm)) ||
                (r.dossier_num && r.dossier_num.toLowerCase().includes(lowerTerm))
            )
        }

        if (statusFilter !== 'All') {
            result = result.filter(r => r.status === statusFilter)
        }

        setFilteredRecords(result)
    }, [records, searchTerm, statusFilter, filterEmployerCompany, filterInsuranceCompany, filterYear, filterType, allEmployees])

    // Auto-scroll and highlight row
    useEffect(() => {
        if (highlightedId) {
            console.log('Highlight effect triggered for ID:', highlightedId)

            // Function to attempt scrolling
            const attemptScroll = () => {
                const element = document.getElementById(`record-${highlightedId}`)
                if (element) {
                    console.log('Found element to highlight:', element)
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

                    // Clear highlight after 4 seconds
                    setTimeout(() => setHighlightedId(null), 4000)
                    return true
                }
                return false
            }

            // Try immediately
            if (!attemptScroll()) {
                console.log('Element not found immediately, retrying...')
                // Try multiple times
                let attempts = 0
                const maxAttempts = 15

                const interval = setInterval(() => {
                    attempts++
                    console.log(`Retry ${attempts}: looking for element record-${highlightedId}`)
                    if (attemptScroll() || attempts >= maxAttempts) {
                        clearInterval(interval)
                        if (attempts >= maxAttempts) {
                            console.log('Max retries reached, giving up on highlight')
                        }
                    }
                }, 300)

                return () => clearInterval(interval)
            }
        }
    }, [highlightedId])

    // --- UI Effects ---

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.assure-autocomplete-container')) {
                setShowAssureDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])


    const handleOpenSidePanel = async () => {
        setIsSidePanelOpen(true)
        await loadAllEmployees()
    }


    const handleSelectEmployee = (employee: any) => {
        setSelectedEmployee(employee)
        setFamilyData({
            numAffiliation: employee.numAffiliation || '',
            conjoint: employee.conjoint || '',
            child1: employee.child1 || '',
            child2: employee.child2 || '',
            child3: employee.child3 || '',
            child4: employee.child4 || '',
            adhesionStatus: employee.adhesionStatus || 'Non Adhéré'
        })
    }

    const handlePrintAccuse = (date: string) => {
        const printRecords = records.filter(r => r.date_depot === date && (filterInsuranceCompany === 'All' || r.company === filterInsuranceCompany));
        const companyName = filterInsuranceCompany === 'All' ? 'Toutes les Compagnies' : filterInsuranceCompany;
        const currentYear = new Date().getFullYear();

        // Debug logs
        console.log('Attempting to open print window...');
        console.log('window.api:', window.api);

        const openPrintFn = window.api?.db?.openPrint || window.api?.file?.openPrint;

        if (!openPrintFn) {
            console.error('CRITICAL: openPrint function not found in window.api.db or window.api.file');
            alert('Error: The printing interface is not ready. Please try restarting the application.');
            return;
        }

        const html = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Accusé de Réception - ${date}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    tailwind.config = {
                        theme: {
                            extend: {
                                fontFamily: {
                                    sans: ['Inter', 'sans-serif'],
                                },
                            }
                        }
                    }
                </script>
                <style>
                    @page { size: landscape; margin: 10mm; }
                    body { font-family: 'Inter', sans-serif; background: white; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    table { border-collapse: collapse; width: 100%; }
                    th { background-color: #2c5282 !important; color: white !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; padding: 10px 12px; border: 1px solid #e5e7eb; }
                    td { padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 10px; vertical-align: middle; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .header-gradient { background: linear-gradient(135deg, #e0f2f7 0%, #b2e0e6 100%); border: 2px solid #a0dae2; }
                    @media print {
                        .no-print { display: none !important; }
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body class="p-6">
                <div class="max-w-[1200px] mx-auto">
                    <!-- Action Buttons (no-print) -->
                    <div class="no-print flex gap-3 mb-6">
                        <button onclick="window.print()" class="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2">
                            <span>🖨️</span> Imprimer
                        </button>
                        <button onclick="window.close()" class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm border border-gray-300 transition-all">
                            Fermer
                        </button>
                    </div>

                    <!-- Receipt Header -->
                    <div class="header-gradient rounded-xl p-3 mb-8 text-center shadow-sm">
                        <h1 class="text-xl font-black text-[#2c5282] uppercase tracking-tight">
                            ACCUSÉ DE RÉCEPTION WAFA ASSURANCE ${currentYear}
                        </h1>
                    </div>

                    <div class="flex justify-end mb-6">
                        <div class="text-right text-gray-700 font-bold text-lg">
                            Tanger Le : <span class="text-black font-extrabold font-mono">${date.split('-').reverse().join('/')}</span>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="rounded-xl border border-gray-200 overflow-hidden shadow-md mb-8">
                        <table class="w-full">
                            <thead>
                                <tr>
                                    <th class="w-12 text-center">#</th>
                                    <th class="text-left">Assuré</th>
                                    <th class="text-left">Bénéficiaire</th>
                                    <th class="text-left">N° dossier</th>
                                    <th class="text-center">Date Déclaration</th>
                                    <th class="text-right">Montant</th>
                                    <th class="text-center">Type</th>
                                    <th class="text-left">Société</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${printRecords.map((r, index) => `
                                    <tr>
                                        <td class="text-center font-bold text-gray-400">${index + 1}</td>
                                        <td class="font-bold text-blue-700 uppercase">${r.assure}</td>
                                        <td class="text-gray-600 font-medium">${r.beneficiaire || '-'}</td>
                                        <td>
                                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono font-bold text-xs ring-1 ring-gray-200">
                                                ${r.dossier_num || '-'}
                                            </span>
                                        </td>
                                        <td class="text-center font-medium">${r.date_declaration ? r.date_declaration.split('-').reverse().join('/') : '-'}</td>
                                        <td class="text-right font-extrabold text-[#059669]">
                                            ${(r.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="text-[10px] text-gray-400">DH</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase border border-blue-100 italic">
                                                ${r.type === 'health' ? 'Maladie' :
                r.type === 'optical' ? 'Optique' :
                    r.type === 'dental' ? 'Dentaire' :
                        getTranslatedType(r.type)}
                                            </span>
                                        </td>
                                        <td class="font-semibold text-gray-700 underline decoration-gray-200 decoration-2 underline-offset-4">${r.employer || r.company || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Summary & Footer -->
                    <div class="flex justify-end pt-8">
                        <div class="text-center">
                            <div class="w-64 border-t-2 border-black pt-2 mb-16">
                                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Cachet & Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        openPrintFn({ html });
    };

    // REPLACE YOUR EXISTING handleAssureSelect FUNCTION WITH THIS UPDATED VERSION 👇
    const handleAssureSelect = (employee: any) => {
        // Check if employee is not adhered
        if (employee.adhesionStatus !== 'Adhéré') {
            setPendingEmployee(employee)
            setShowNonAdherentWarning(true)
            return
        }

        // If adhered, proceed normally
        proceedWithAssureSelection(employee)
    }

    // ADD THIS NEW FUNCTION 👇
    const proceedWithAssureSelection = (employee: any) => {
        const family = [
            employee.fullName,
            employee.conjoint,
            employee.child1,
            employee.child2,
            employee.child3,
            employee.child4
        ].filter(Boolean)

        setFormData({
            ...formData,
            assure: employee.fullName,
            numAffiliation: employee.numAffiliation || '',
            beneficiaire: employee.fullName, // Default beneficiaire to Assuré
            employer: employee.companyName // For display in modal
        })
        setFamilyOptions(family)
        setAssureSearch(employee.fullName)
        setShowAssureDropdown(false)
    }

    // ADD THIS NEW FUNCTION 👇
    const forceProceedWithNonAdherent = () => {
        if (pendingEmployee) {
            proceedWithAssureSelection(pendingEmployee)
            setShowNonAdherentWarning(false)
            setPendingEmployee(null)
        }
    }

    const saveFamilyData = async () => {
        if (!selectedEmployee) return
        try {
            await window.api.db.updateAssuranceEmployee({
                id: selectedEmployee.id,
                companyName: selectedEmployee.companyName,
                data: { ...familyData, fullName: selectedEmployee.fullName }
            })

            // Reload employees to reflect changes
            await loadAllEmployees()

            // Update local state for selection
            setSelectedEmployee({ ...selectedEmployee, ...familyData })
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 3000)
        } catch (error) {
            console.error("Failed to save family data", error)
        }
    }

    const filteredEmployees = allEmployees.filter(emp => {
        const matchesSearch = emp.fullName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            (emp.companyName && emp.companyName.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
        const matchesStatus = emp.status === 'En cours'
        return matchesSearch && matchesStatus
    })

    // --- CRUD Handlers ---
    const handleAdd = async () => {
        try {
            const finalAmount = evaluateArithmetic(amountText)
            const payload = { ...formData, montant: finalAmount }
            const result = await window.api.db.addAssurance(payload)

            // Close modal first
            setIsAddModalOpen(false)
            setFormData({})
            setAmountText('')
            setAssureSearch('')
            setFamilyOptions([])

            // Fetch fresh data and wait for it to complete
            await fetchData()

            // Extract the new ID
            const newId = (typeof result === 'object' && result?.id) ? result.id : (typeof result === 'number' ? result : null)

            if (newId) {
                console.log('Setting highlighted ID:', newId)
                setHighlightedId(newId)
            } else {
                console.warn('Could not determine new record ID from result:', result)
            }

        } catch (error) {
            console.error('Failed to add assurance:', error)
        }
    }

    const handleEdit = async () => {
        if (!currentRecord) return
        try {
            const finalAmount = evaluateArithmetic(amountText)
            const payload = { ...formData, montant: finalAmount }
            await window.api.db.updateAssurance(currentRecord.id, payload)

            await fetchData()

            setHighlightedId(currentRecord.id)
            setIsEditModalOpen(false)
            setCurrentRecord(null)
            setFormData({})
            setAmountText('')
            setAssureSearch('')
            setFamilyOptions([])

        } catch (error) {
            console.error('Failed to update assurance:', error)
        }
    }

    const handleDelete = async () => {
        if (!currentRecord) return
        try {
            await window.api.db.deleteAssurance(currentRecord.id)
            setIsDeleteModalOpen(false)
            setCurrentRecord(null)
            fetchData()
        } catch (error) {
            console.error('Failed to delete assurance:', error)
        }
    }

    const openAddModal = () => {
        const currentInsurer = filterInsuranceCompany !== 'All'
            ? filterInsuranceCompany
            : (insuranceCompanies.find(c => c.is_default === 1)?.name || (insuranceCompanies.length > 0 ? insuranceCompanies[0].name : ''))

        setFormData({
            status: 'En cours',
            date_declaration: new Date().toISOString().split('T')[0],
            date_depot: new Date().toISOString().split('T')[0],
            company: currentInsurer,
            type: 'health',
            documents_joints: [],
            montant: 0,
            montant_rembourse: 0,
            taux: 0,
            date_remboursement: '',
            numAffiliation: ''
        })
        setAmountText('0')
        setAssureSearch('')
        setFamilyOptions([])
        setIsAddModalOpen(true)
    }

    const openEditModal = (record: AssuranceRecord) => {
        setCurrentRecord(record)
        setFormData({ ...record, documents_joints: record.documents_joints || [] })
        setAmountText(record.montant?.toString() || '0')
        setAssureSearch(record.assure || '')

        // Attempt to find family options for the beneficiaire dropdown
        const emp = allEmployees.find(e => e.fullName === record.assure)
        if (emp) {
            setFamilyOptions([
                emp.fullName,
                emp.conjoint,
                emp.child1,
                emp.child2,
                emp.child3,
                emp.child4
            ].filter(Boolean))
            setFormData(prev => ({ ...prev, employer: emp.companyName }))
        } else {
            setFamilyOptions(record.beneficiaire ? [record.beneficiaire] : [])
        }

        setIsEditModalOpen(true)
    }

    const openDeleteModal = (record: AssuranceRecord) => {
        setCurrentRecord(record)
        setIsDeleteModalOpen(true)
    }

    const addDocument = () => {
        if (selectedDocument) {
            const currentDocs = formData.documents_joints || []
            if (!currentDocs.includes(selectedDocument)) {
                setFormData({ ...formData, documents_joints: [...currentDocs, selectedDocument] })
                setSelectedDocument('')
            }
        }
    }

    const removeDocument = (index: number) => {
        const currentDocs = formData.documents_joints || []
        setFormData({ ...formData, documents_joints: currentDocs.filter((_, i) => i !== index) })
    }

    return (
        <div className="h-[calc(100vh-5rem)] w-full bg-[#141414] text-white p-6 space-y-6 overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="flex-none sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-b border-white/5 pb-4 space-y-4 shadow-lg shadow-black/50">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 w-full">
                        {/* Insurance Company Selector (Premium style) */}
                        <div className="relative group shrink-0 z-50">
                            <button className="flex items-center gap-3 bg-[#27272a] hover:bg-white/10 border border-white/5 rounded-2xl px-4 py-2.5 min-w-[180px] transition-all text-left shadow-sm">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1">{t('insurance')}</p>
                                    <p className="text-sm font-bold text-white truncate max-w-[120px]">{filterInsuranceCompany === 'All' ? t('allCarriers') : filterInsuranceCompany}</p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            </button>

                            <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-[100]">
                                <button
                                    onClick={() => setFilterInsuranceCompany('All')}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${filterInsuranceCompany === 'All'
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {t('allCarriers')}
                                </button>
                                {insuranceCompanies.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setFilterInsuranceCompany(c.name)}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${filterInsuranceCompany === c.name
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#ffcc4d] transition-colors" />
                            <input
                                type="text"
                                placeholder={t('searchNameDossier')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 transition-all shadow-sm"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${isFilterOpen || filterYear !== 'All' || filterType !== 'All' || filterEmployerCompany !== 'All'
                                    ? 'bg-[#ffcc4d] text-black border-[#ffcc4d]'
                                    : 'bg-[#27272a] text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">{t('more')}</span>
                            </button>
                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('insurance')}</label>
                                            <select
                                                value={filterInsuranceCompany}
                                                onChange={(e) => setFilterInsuranceCompany(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffcc4d]/50"
                                            >
                                                <option value="All">{t('allInsurance')}</option>
                                                {insuranceCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('employerCompany')}</label>
                                            <select
                                                value={filterEmployerCompany}
                                                onChange={(e) => setFilterEmployerCompany(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffcc4d]/50"
                                            >
                                                <option value="All">{t('allEmployers')}</option>
                                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('year')}</label>
                                            <select
                                                value={filterYear}
                                                onChange={(e) => setFilterYear(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffcc4d]/50"
                                            >
                                                <option value="All">{t('allYears')}</option>
                                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('type')}</label>
                                            <select
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffcc4d]/50"
                                            >
                                                <option value="All">{t('allTypes')}</option>
                                                {insuranceTypes.map(it => <option key={it.key} value={it.value}>{t(it.key as any)}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status')}</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffcc4d]/50"
                                            >
                                                <option value="All">{t('allStatus')}</option>
                                                <option value="En cours">{t('enCours')}</option>
                                                <option value="Remboursé">{t('reimbursed')}</option>
                                                <option value="Rejeté">{t('rejected')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="relative group shrink-0">
                            <button
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border ${availableDepositDates.length > 0 ? 'bg-[#27272a] text-slate-300 border-white/5 hover:bg-white/10 hover:text-white' : 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500 border-white/5'}`}
                                disabled={availableDepositDates.length === 0}
                            >
                                <Printer className="w-4 h-4" />
                                <span className="text-sm">{t('accuse')}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {availableDepositDates.length > 0 && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-[100]">
                                    <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('dateDepot')}</p>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {availableDepositDates.map(date => (
                                            <button
                                                key={date}
                                                onClick={() => handlePrintAccuse(date)}
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                                            >
                                                <span>{formatDate(date)}</span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-[#ffcc4d] hover:bg-[#ffcc4d]/90 text-black px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#ffcc4d]/20 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('addRecord')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area with Split View */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                {/* Main Table */}
                <div className={`flex-1 transition-all duration-300 ease-in-out flex flex-col ${isSidePanelOpen ? 'w-2/3' : 'w-full'}`}>
                    <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.02] shadow-xl flex-1 flex flex-col">
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-[#141414] z-10 shadow-md">
                                    <tr className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                                        <th className="p-4 whitespace-nowrap">{t('company')}</th>
                                        <th className="p-4 whitespace-nowrap">{t('assureBeneficiaire')}</th>
                                        <th className="p-4 whitespace-nowrap">{t('dossierNum')}</th>
                                        <th className="p-4 whitespace-nowrap">{t('affiliation')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('decl')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('depot')}</th>
                                        <th className="p-4 whitespace-nowrap text-right">{t('amount')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('status')}</th>
                                        <th className="p-4 whitespace-nowrap text-right">{t('reimbursed')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('dateRemb')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('rate')}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('actions')}</th>
                                        <th className="p-4 whitespace-nowrap text-right w-10">
                                            <button
                                                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                                                className={`p-1.5 rounded-lg transition-all ${isSidePanelOpen
                                                    ? 'bg-[#ffcc4d] text-black'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                title="Toggle Family Panel"
                                            >
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isSidePanelOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredRecords.length > 0 ? (
                                        filteredRecords.map((record) => (
                                            <tr
                                                key={record.id}
                                                id={`record-${record.id}`}
                                                className={`hover:bg-white/5 transition-all duration-700 group ${highlightedId === record.id
                                                    ? 'bg-[#ffcc4d]/20 ring-2 ring-[#ffcc4d]/50 shadow-2xl shadow-[#ffcc4d]/10'
                                                    : 'bg-transparent'
                                                    }`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                            <Building2 className="w-4 h-4 text-blue-400" />
                                                        </div>
                                                        <span className="text-sm font-bold text-blue-400 uppercase tracking-tighter">
                                                            {record.employer || allEmployees.find(e => e.fullName === record.assure)?.companyName || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-white text-base max-w-[180px] truncate" title={record.assure}>{record.assure}</div>
                                                    <div className="text-sm flex flex-col gap-0.5 mt-1">
                                                        <span className="text-[#ffcc4d] font-bold">{record.beneficiaire}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="font-mono font-bold text-slate-200">{record.dossier_num || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-[#ffcc4d] font-black font-mono">
                                                        {record.numAffiliation || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="text-sm text-white font-bold font-mono">
                                                        {formatDate(record.date_declaration)}
                                                    </div>
                                                    <div className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-tighter">
                                                        {getTranslatedType(record.type)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="text-sm text-slate-200 font-bold font-mono">
                                                        {formatDate(record.date_depot)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="font-bold text-[#ffcc4d] font-mono">
                                                        {record.montant?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${record.status === 'Remboursé' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        record.status === 'Rejeté' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>
                                                        {record.status === 'Remboursé' ? t('reimbursed') :
                                                            record.status === 'Rejeté' ? t('rejected') :
                                                                t('enCours')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {record.montant_rembourse > 0 ? (
                                                        <div className="font-bold text-green-400 font-mono">
                                                            {record.montant_rembourse?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {record.date_remboursement ? (
                                                        <div className="text-sm text-green-400 font-bold font-mono">
                                                            {formatDate(record.date_remboursement)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs font-bold">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {record.montant > 0 && record.montant_rembourse > 0 ? (
                                                        <div className="text-sm font-bold text-blue-400 font-mono">
                                                            {((record.montant_rembourse / record.montant) * 100).toFixed(1)}%
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 opacity-100">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenSidePanel() }}
                                                            className="p-2 bg-[#ffcc4d]/10 text-[#ffcc4d] hover:bg-[#ffcc4d] hover:text-black rounded-lg transition-all"
                                                            title="Manage Family Details"
                                                        >
                                                            <Users className="w-3.5 h-3.5" />
                                                        </button>
                                                        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(record) }}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDeleteModal(record) }}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center"></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={13} className="p-12 text-center text-slate-500">
                                                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>{t('noAssuranceFound')}</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div >

                {/* Side Panel - Employee Family Management */}
                {
                    isSidePanelOpen && (
                        <div className="w-[40%] min-w-[500px] bg-[#1e1e1e] rounded-2xl border border-white/5 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#242427]">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#ffcc4d]" />
                                        {t('employeeManagement')}
                                    </h2>

                                </div>
                                <button onClick={() => { setIsSidePanelOpen(false); setSelectedEmployee(null) }} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {showSuccessToast && (
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-2xl shadow-green-500/10">
                                        <div className="bg-green-500/20 p-1 rounded-full">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-wider">{t('changesSaved')}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 flex overflow-hidden">
                                {/* Employee List */}
                                <div className="w-2/5 border-r border-white/5 flex flex-col">
                                    <div className="p-4 border-b border-white/5 space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder={t('searchEmployees')}
                                                value={employeeSearchTerm}
                                                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                                className="w-full bg-[#27272a] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ffcc4d]/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {sidePanelLoading ? (
                                            <div className="flex justify-center py-10">
                                                <div className="animate-spin h-6 w-6 border-2 border-[#ffcc4d] border-t-transparent rounded-full"></div>
                                            </div>
                                        ) : filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((emp) => (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => handleSelectEmployee(emp)}
                                                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-[#ffcc4d]/10 border-l-2 border-l-[#ffcc4d]' : ''
                                                        }`}
                                                >
                                                    <div className="font-bold text-white text-sm truncate">{emp.fullName}</div>
                                                    <div className="text-xs text-slate-400 truncate">{emp.companyName}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1">{t('affiliation')}: {emp.numAffiliation || t('affiliationNotSet')}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">{t('noEmployeesFound')}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Employee Edit Form */}
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                    {selectedEmployee ? (
                                        <div className="space-y-6">
                                            {/* Main Info */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('employeeName')}</label>
                                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-sm font-bold text-white flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-500" />
                                                        {selectedEmployee?.fullName}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('company')}</label>
                                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-sm font-bold text-slate-300 flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-slate-500" />
                                                        {selectedEmployee?.companyName}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400">{t('affiliationNum')}</label>
                                                    <input
                                                        type="text"
                                                        value={familyData.numAffiliation || ''}
                                                        onChange={e => setFamilyData({ ...familyData, numAffiliation: e.target.value })}
                                                        className="w-full bg-[#27272a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ffcc4d] focus:outline-none font-mono"
                                                        placeholder={t('enterAffiliationNumber')}
                                                    />
                                                </div>
                                            </div>

                                            {/* Family Details */}
                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                <h3 className="text-xs font-black text-[#ffcc4d] uppercase tracking-widest">{t('beneficiaries')}</h3>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400">{t('spouse')}</label>
                                                        <input
                                                            type="text"
                                                            value={familyData.conjoint || ''}
                                                            onChange={e => setFamilyData({ ...familyData, conjoint: e.target.value })}
                                                            className="w-full bg-[#27272a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                            placeholder={t('spouseName')}
                                                        />
                                                    </div>

                                                    {[1, 2, 3, 4].map(num => (
                                                        <div key={num} className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-400">{t('child')} {num}</label>
                                                            <input
                                                                type="text"
                                                                value={familyData[`child${num}`] || ''}
                                                                onChange={e => setFamilyData({ ...familyData, [`child${num}`]: e.target.value })}
                                                                className="w-full bg-[#27272a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                                placeholder={`${t('child')} ${num} ${t('name')}`}
                                                            />
                                                        </div>
                                                    ))}

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400">{t('adhesionStatus')}</label>
                                                        <div
                                                            onClick={() => setFamilyData({ ...familyData, adhesionStatus: familyData.adhesionStatus === 'Adhéré' ? 'Non Adhéré' : 'Adhéré' })}
                                                            className="w-full bg-[#27272a] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                                                        >
                                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{t('adhered')}</span>
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${familyData.adhesionStatus === 'Adhéré'
                                                                ? 'bg-[#ffcc4d] border-[#ffcc4d]'
                                                                : 'bg-transparent border-white/20'
                                                                }`}>
                                                                {familyData.adhesionStatus === 'Adhéré' && <Check className="w-3.5 h-3.5 text-black font-black" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={saveFamilyData}
                                                    className="w-full py-3 bg-[#ffcc4d] text-black font-bold rounded-xl mt-4 hover:bg-[#ffcc4d]/90 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {t('saveChanges')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                            <User className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-sm">{t('selectEmployeeToEdit')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Redesigned Smaller Add/Edit Modal */}
                {
                    (isAddModalOpen || isEditModalOpen) && (
                        <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                            <div className="bg-[#18181b] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                                {/* Modal Header */}
                                <div className="p-6 pb-4 flex justify-between items-center bg-gradient-to-b from-white/[0.02] to-transparent">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-[#ffcc4d]/20 rounded-xl text-[#ffcc4d]">
                                            {isEditModalOpen ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                        </div>
                                        {isEditModalOpen ? t('editRecord') : t('newAssurance')}
                                    </h2>
                                    <button
                                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex-1">

                                    <div className="space-y-4 mb-6 pt-4">
                                        {!insuranceCompanies.find(c => c.is_default === 1) && !isEditModalOpen && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 mb-6">
                                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                                <div className="text-xs text-amber-200/80 leading-relaxed">
                                                    <span className="font-bold block text-amber-500 mb-1 uppercase tracking-wider">{t('noDefaultCarrier')}</span>
                                                    {t('selectDefaultCarrierWarning')}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1 relative assure-autocomplete-container">
                                                <label className="text-xs font-bold text-slate-400">{t('assure')}</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={assureSearch}
                                                        onChange={e => {
                                                            setAssureSearch(e.target.value)
                                                            setShowAssureDropdown(true)
                                                        }}
                                                        onFocus={() => setShowAssureDropdown(true)}
                                                        className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                        placeholder="Search Name..."
                                                    />
                                                    {showAssureDropdown && assureSearch.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                                                            {allEmployees
                                                                .filter(emp => emp.fullName.toLowerCase().includes(assureSearch.toLowerCase()))
                                                                .map(emp => (
                                                                    <button
                                                                        key={emp.id}
                                                                        onClick={() => handleAssureSelect(emp)}
                                                                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#ffcc4d]/10 hover:text-[#ffcc4d] transition-colors flex flex-col"
                                                                    >
                                                                        <span className="font-bold">{emp.fullName}</span>
                                                                        <span className="text-[10px] opacity-50 uppercase">{emp.companyName}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Employer</label>
                                                <div className="flex items-center gap-2 bg-[#27272a]/50 border border-white/5 rounded-lg px-3 py-2">
                                                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="text-sm font-bold text-slate-300">
                                                        {(formData as any).employer || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">N° Affiliation</label>
                                                <input
                                                    type="text"
                                                    value={formData.numAffiliation || ''}
                                                    onChange={e => setFormData({ ...formData, numAffiliation: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                    placeholder="Auto-filled"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Bénéficiaire</label>
                                                <select
                                                    value={formData.beneficiaire || ''}
                                                    onChange={e => setFormData({ ...formData, beneficiaire: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                >
                                                    <option value="">Select Beneficiary</option>
                                                    {familyOptions.map(member => (
                                                        <option key={member} value={member}>{member}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Type</label>
                                                <select
                                                    value={formData.type || ''}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                >
                                                    <option value="" disabled>Select</option>
                                                    {insuranceTypes.map(it => <option key={it.key} value={it.key}>{it.value}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Dossier #</label>
                                                <input
                                                    type="text"
                                                    value={formData.dossier_num || ''}
                                                    onChange={e => setFormData({ ...formData, dossier_num: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Amount (MAD)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={amountText}
                                                        onChange={e => setAmountText(e.target.value)}
                                                        className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none font-mono"
                                                    />
                                                    {amountText.includes('+') && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#ffcc4d] bg-black/40 px-2 py-0.5 rounded border border-[#ffcc4d]/20">
                                                            = {evaluateArithmetic(amountText).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Date Déclaration</label>
                                                <input
                                                    type="date"
                                                    value={formData.date_declaration || ''}
                                                    onChange={e => setFormData({ ...formData, date_declaration: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Date Dépôt</label>
                                                <input
                                                    type="date"
                                                    value={formData.date_depot || ''}
                                                    onChange={e => setFormData({ ...formData, date_depot: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Reimbursement */}
                                    <div className="space-y-4 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                                        <h3 className="text-[10px] font-black text-[#ffcc4d] uppercase tracking-widest mb-1">Reimbursement</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.date_remboursement || ''}
                                                    onChange={e => setFormData({ ...formData, date_remboursement: e.target.value })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                                    placeholder="jj/mm/aaaa"
                                                />
                                                <p className="text-[10px] text-slate-500 mt-0.5 ml-1">jj/mm/aaaa</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400">Amount (DH)</label>
                                                <input
                                                    type="number"
                                                    value={formData.montant_rembourse || ''}
                                                    onChange={e => setFormData({ ...formData, montant_rembourse: parseFloat(e.target.value) })}
                                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Bar beneath */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                                                {(['En cours', 'Remboursé', 'Rejeté'] as const).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setFormData({ ...formData, status })}
                                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${formData.status === status
                                                            ? status === 'Remboursé' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                                                : status === 'Rejeté' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                                    : 'bg-[#ffcc4d] text-black shadow-lg shadow-[#ffcc4d]/20'
                                                            : 'text-slate-500 hover:text-slate-300'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Docs */}
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Documents</h3>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedDocument}
                                                onChange={(e) => setSelectedDocument(e.target.value)}
                                                className="flex-1 bg-[#27272a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ffcc4d] focus:outline-none"
                                            >
                                                <option value="" disabled>Select Doc</option>
                                                {documentTypes.map(d => <option key={d.key} value={d.key}>{d.value}</option>)}
                                            </select>
                                            <button
                                                onClick={addDocument}
                                                disabled={!selectedDocument}
                                                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs font-bold border border-white/5 disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.documents_joints?.map((doc, i) => (
                                                <div key={i} className="flex items-center gap-1 bg-[#ffcc4d]/10 text-[#ffcc4d] text-xs px-2 py-1 rounded border border-[#ffcc4d]/20">
                                                    {doc}
                                                    <button onClick={() => removeDocument(i)} className="hover:text-white ml-1"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#1e1e1e]">
                                    <button
                                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={isEditModalOpen ? handleEdit : handleAdd}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#ffcc4d] text-black hover:bg-[#ffcc4d]/90 shadow-lg shadow-[#ffcc4d]/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {isEditModalOpen ? 'Save' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Delete Modal */}
                {
                    isDeleteModalOpen && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-8 text-center animate-scale-in">
                                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Delete Record?</h3>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                    Are you sure you want to delete this assurance record for <br />
                                    <span className="text-white font-bold block mt-1 text-base">{currentRecord?.assure}</span>
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ADD THE NON-ADHERENT WARNING MODAL HERE 👇 - RIGHT AFTER DELETE MODAL */}
                {/* Non-Adherent Warning Modal */}
                {
                    showNonAdherentWarning && (
                        <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#1e1e1e] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 text-center animate-scale-in">
                                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Non-Adhéré Employee</h3>
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                    <span className="text-white font-bold block text-base mb-2">{pendingEmployee?.fullName}</span>
                                    This employee is currently marked as <span className="text-amber-500 font-bold">"Non Adhéré"</span> in the system.
                                </p>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
                                    <p className="text-xs text-amber-200/90 leading-relaxed">
                                        <span className="font-bold block mb-1 text-amber-500">⚠️ Warning:</span>
                                        Creating an assurance claim for a non-adhéré employee may cause issues with reimbursement.
                                        Consider updating their adhesion status first in the employee management panel.
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            setShowNonAdherentWarning(false)
                                            setPendingEmployee(null)
                                        }}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={forceProceedWithNonAdherent}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                                    >
                                        Proceed Anyway
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-4">
                                    You can update adhesion status in the Employee Management panel
                                </p>
                            </div>
                        </div>
                    )
                }

            </div>
        </div>
    )
}