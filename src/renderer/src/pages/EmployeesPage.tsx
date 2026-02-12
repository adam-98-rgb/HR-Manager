import { useState, useEffect } from 'react'
import { UserPlus, Search, Filter, ChevronDown, Building2 } from 'lucide-react'
// import StatsCard from '../components/StatsCard' // Obsolete in the new design
import EmployeeCard from '../components/EmployeeCard'
import EmployeeModal from '../components/EmployeeModal'
import { Employee } from '../data/mockData'
import AddEmployeeModal from '../components/AddEmployeeModal'
import EditEmployeeModal from '../components/EditEmployeeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function EmployeesPage(): JSX.Element {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'En cours' | 'Sortie'>('En cours')
    const [selectedCompany, setSelectedCompany] = useState('')

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
                const dbEmployees = await window.api.db.getEmployees({
                    companyName: currentCompany,
                    status: viewMode
                })
                setEmployees(dbEmployees)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedCompany, viewMode])

    const handleCardClick = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsViewModalOpen(true)
    }

    const handleAdd = async (newEmployee: Employee) => {
        try {
            await window.api.db.saveEmployee(newEmployee)
            await fetchData()
            setIsAddModalOpen(false)
        } catch (error) {
            console.error('Failed to add employee:', error)
        }
    }

    const handleEdit = async (updatedEmployee: Employee) => {
        try {
            await window.api.db.saveEmployee(updatedEmployee)
            await fetchData()
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Failed to update employee:', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await window.api.db.deleteEmployee({ id, companyName: selectedCompany, status: viewMode })
            await fetchData()
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error('Failed to delete employee:', error)
        }
    }

    // Filter employees based on search term, view mode, and selected company
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesViewMode = emp.status === viewMode

        const matchesCompany = !selectedCompany || emp.company === selectedCompany

        return matchesSearch && matchesViewMode && matchesCompany
    })

    return (
        <div className="h-[calc(100vh-5rem)] w-full bg-[#141414] text-white p-6 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar">
            {/* Sticky Action Header */}
            <div className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-b border-white/5 -mx-6 px-6 py-4 space-y-4">

                {/* Top Row: Companies, Search, Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center">

                    {/* Companies Dropdown */}
                    <div className="relative group shrink-0 z-50">
                        <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-4 py-3 min-w-[200px] transition-all text-left">
                            <div className="p-2 bg-[#ffcc4d]/10 rounded-lg text-[#ffcc4d]">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Company</p>
                                <p className="text-sm font-bold text-white truncate">{selectedCompany}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                            {companies.map((company) => (
                                <button
                                    key={company}
                                    onClick={() => setSelectedCompany(company)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${selectedCompany === company
                                        ? 'bg-[#ffcc4d]/10 text-[#ffcc4d]'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {company}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar - Stretches to fill space */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 shrink-0">
                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#ffcc4d] hover:bg-[#ffcc4d]/90 text-black px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#ffcc4d]/20 active:scale-95"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Employee</span>
                        </button>
                    </div>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex gap-6 border-b border-white/10 -mb-4"> {/* -mb-4 to offset default space-y-4 */}
                    <button
                        onClick={() => setViewMode('En cours')}
                        className={`pb-3 text-sm font-bold tracking-wide transition-all relative ${viewMode === 'En cours' ? 'text-[#ffcc4d]' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Personnel En cours
                        {viewMode === 'En cours' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffcc4d] rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setViewMode('Sortie')}
                        className={`pb-3 text-sm font-bold tracking-wide transition-all relative ${viewMode === 'Sortie' ? 'text-[#ffcc4d]' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Personnel Sortie
                        {viewMode === 'Sortie' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffcc4d] rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Grid with Dark/Glass Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredEmployees.map((emp) => (
                    <EmployeeCard
                        key={emp.id}
                        employee={emp}
                        onClick={() => handleCardClick(emp)}
                        onEdit={() => { setSelectedEmployee(emp); setIsEditModalOpen(true); }}
                        onDelete={() => { setSelectedEmployee(emp); setIsDeleteModalOpen(true); }}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-white/50">No employees found in "{viewMode}" for "{selectedCompany}"</p>
                </div>
            )}

            <EmployeeModal
                isOpen={isViewModalOpen}
                employee={selectedEmployee}
                onClose={() => setIsViewModalOpen(false)}
            />

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAdd}
                defaultCompany={selectedCompany}
                defaultStatus={viewMode}
            />

            <EditEmployeeModal
                isOpen={isEditModalOpen}
                employee={selectedEmployee}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEdit}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                employee={selectedEmployee}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => handleDelete(selectedEmployee!.id)}
            />
        </div>
    )
}
