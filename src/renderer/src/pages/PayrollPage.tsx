import { useState, useEffect } from 'react';
import {
    Search,
    FileText,
    Building2,
    ChevronDown,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { calculatePayroll } from '../lib/payrollUtils';
import BulletinPaieDocument from '../components/documents/BulletinPaieDocument';
import PayrollEditModal from '../components/PayrollEditModal';
import { getIsFemale } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function PayrollPage() {
    const { t, language } = useLanguage();
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'En cours' | 'Sortie'>('En cours');
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    // Selection state
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const fetchedCompanies = await window.api.db.getCompanies();
                setCompanies(fetchedCompanies);
                if (fetchedCompanies.length > 0) {
                    setSelectedCompany(fetchedCompanies[0].name);
                }
            } catch (error) {
                console.error('Failed to load companies:', error);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            loadPayrollData();
        }
    }, [selectedCompany, viewMode]);

    const loadPayrollData = async () => {
        setLoading(true);
        try {
            const data = await window.api.db.getPayrollEmployees({ companyName: selectedCompany, status: viewMode });
            // Sort by ID (matricule) in ascending order
            const sortedData = data.sort((a, b) => {
                const idA = parseInt(a.id) || 0
                const idB = parseInt(b.id) || 0
                return idA - idB
            })
            setEmployees(sortedData);
        } catch (error) {
            console.error('Failed to load payroll data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (emp.fullName || emp.empFullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase());

        if (viewMode === 'Sortie' && emp.dateSortie) {
            const departureDate = new Date(emp.dateSortie);
            const m = departureDate.getMonth() + 1;
            const y = departureDate.getFullYear();
            return matchesSearch && m === filterMonth && y === filterYear;
        }

        return matchesSearch;
    });

    useEffect(() => {
        if (!loading) {
            if (filteredEmployees.length > 0) {
                if (!selectedEmployee || !filteredEmployees.find(e => e.id === selectedEmployee.id)) {
                    setSelectedEmployee(filteredEmployees[0]);
                }
            } else {
                setSelectedEmployee(null);
            }
        }
    }, [filteredEmployees, loading]);

    const handleSaveRow = async (updatedEmp: any) => {
        try {
            await window.api.db.updatePayrollData({
                id: updatedEmp.id,
                companyName: selectedCompany,
                status: viewMode,
                data: {
                    salaire_base: updatedEmp.salaire_base,
                    prime_rendement: updatedEmp.prime_rendement,
                    indemnite_panier: updatedEmp.indemnite_panier,
                    num_deduction: updatedEmp.num_deduction,
                    conge: updatedEmp.conge,
                    absence: updatedEmp.absence,
                    jf: updatedEmp.jf,
                    avance: updatedEmp.avance
                }
            });
            // Update local state
            setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
            if (selectedEmployee?.id === updatedEmp.id) {
                setSelectedEmployee(updatedEmp);
            }
        } catch (error) {
            console.error('Failed to save payroll:', error);
        }
    };


    const currentCompany = companies.find(c => c.name === selectedCompany);

    return (
        <div className="h-[calc(100vh-5rem)] w-full bg-[#141414] text-white flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="bg-[#141414]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 space-y-4 shrink-0">
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
                                    key={company.id}
                                    onClick={() => setSelectedCompany(company.name)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${selectedCompany === company.name ? 'bg-[#ffcc4d]/10 text-[#ffcc4d]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {company.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('searchPay')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 transition-all"
                        />
                    </div>

                    {/* Date Filters for Sortie */}
                    {viewMode === 'Sortie' && (
                        <div className="flex gap-3 shrink-0">
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1} className="bg-[#1e1e1e]">
                                        {new Date(0, i).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                            >
                                {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i} value={new Date().getFullYear() - i} className="bg-[#1e1e1e]">
                                        {new Date().getFullYear() - i}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-white/10 -mb-4">
                    <button
                        onClick={() => setViewMode('En cours')}
                        className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${viewMode === 'En cours' ? 'text-[#ffcc4d]' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t('enCoursStaff')}
                        {viewMode === 'En cours' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffcc4d] rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('Sortie')}
                        className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${viewMode === 'Sortie' ? 'text-[#ffcc4d]' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t('sortieStaff')}
                        {viewMode === 'Sortie' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffcc4d] rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* Main Content: 3D Split View */}
            <div className="flex-1 flex gap-8 p-8 overflow-hidden bg-[#0a0a0a] min-h-0">
                {/* Left Side: 3D Table Card */}
                <div className="w-[60%] h-full flex flex-col bg-[#111111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative">
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                    <div className="flex-1 overflow-auto custom-scrollbar relative z-10">
                        {loading ? (
                            <div className="flex items-center justify-center grow h-full">
                                <Loader2 className="w-10 h-10 animate-spin text-[#ffcc4d]" />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20 bg-[#111111]">
                                    <tr className="border-b border-white/[0.05]">
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter pl-8">{t('collaborator')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('baseSalary')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('performanceBonus')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('basketAllowance')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('leave')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('absence')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('holiday')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('advance')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{t('deductionNum')}</th>
                                        <th className="py-6 px-4 text-[10px] font-black text-[#ffcc4d] uppercase tracking-tighter text-right pr-8">{t('netToPay')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredEmployees.map((emp) => {
                                        const calc = calculatePayroll(emp, {
                                            conge: emp.conge || 0,
                                            absence: emp.absence || 0,
                                            jf: emp.jf || 0,
                                            avance: emp.avance || 0
                                        });
                                        const isSelected = selectedEmployee?.id === emp.id;

                                        return (
                                            <tr
                                                key={emp.id}
                                                onClick={() => setSelectedEmployee(emp)}
                                                onDoubleClick={() => setIsEditModalOpen(true)}
                                                className={`cursor-pointer relative ${isSelected ? 'bg-[#ffcc4d]/5' : 'hover:bg-white/[0.02]'}`}
                                            >
                                                <td className="p-3 pl-8 relative">
                                                    {isSelected && <div className="absolute left-0 top-0 w-1 h-full bg-[#ffcc4d]" />}
                                                    <div className="flex items-center gap-3">
                                                        <div className={`relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 ${isSelected ? 'border-[#ffcc4d]' : 'border-white/10'}`}>
                                                            {(() => {
                                                                const getImageUrl = (path: string) => {
                                                                    if (!path) return '';
                                                                    if (path.startsWith('http') || path.startsWith('/storage') || path.startsWith('/icons')) {
                                                                        return imageRefreshKey && path.startsWith('/storage') ? `${path}?t=${imageRefreshKey}` : path
                                                                    }
                                                                    if (path.includes(':') || path.startsWith('/') || path.startsWith('\\')) {
                                                                        const url = `file:///${path.replace(/\\/g, '/')}`
                                                                        return imageRefreshKey ? `${url}?t=${imageRefreshKey}` : url
                                                                    }
                                                                    return path;
                                                                };
                                                                const isFemale = getIsFemale(emp.gender || emp.empGender);
                                                                const defaultIcon = `/icons/${isFemale ? 'female.png' : 'male.png'}`;
                                                                const photoUrl = emp.avatar || emp.photo || emp.empAvatar;

                                                                return photoUrl ? (
                                                                    <img
                                                                        src={getImageUrl(photoUrl)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).onerror = null;
                                                                            (e.target as HTMLImageElement).src = defaultIcon;
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={defaultIcon}
                                                                        alt=""
                                                                        className="w-full h-full object-cover opacity-80"
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="space-y-0">
                                                            <p className={`text-[13px] font-black leading-tight ${isSelected ? 'text-[#ffcc4d]' : 'text-white/90'}`}>
                                                                {emp.fullName || emp.empFullName}
                                                            </p>
                                                            <p className={`text-[10px] font-bold ${isSelected ? 'text-[#ffcc4d]/40' : 'text-slate-500'}`}>#{emp.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{(emp.salaire_base || 0).toFixed(3)}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{(emp.prime_rendement || 0).toFixed(3)}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{(emp.indemnite_panier || 0).toFixed(3)}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-black text-slate-400">{emp.conge || 0}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[11px] font-black ${emp.absence > 0 ? 'text-red-500/80' : 'text-slate-400'}`}>{emp.absence || 0}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-black text-slate-400">{emp.jf || 0}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[11px] font-black ${emp.avance > 0 ? 'text-red-400/80' : 'text-slate-400'}`}>{emp.avance || 0}</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{emp.num_deduction || 0}</span>
                                                </td>
                                                <td className="p-3 text-right pr-8">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-[14px] font-black tabular-nums ${isSelected ? 'text-[#f6c344]' : 'text-[#ffcc4d]'}`}>
                                                                {calc.netAPayer.toFixed(2)}
                                                            </span>
                                                            <span className={`text-[9px] font-black ${isSelected ? 'text-[#ffcc4d]/60' : 'text-slate-600'}`}>MAD</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Side: 3D Preview Card */}
                <div className="w-[40%] h-full flex flex-col bg-[#111111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,204,77,0.05),transparent_50%)]" />
                    <div className="p-3 border-b border-white/[0.05] flex justify-between items-center bg-[#111111] relative z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#ffcc4d] rounded-lg flex items-center justify-center shadow-[0_5px_15px_rgba(255,204,77,0.2)]">
                                <FileText className="w-4 h-4 text-[#111111]" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-0.5">{t('paySlip')}</h3>
                            </div>
                        </div>
                        {selectedEmployee && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const currentIndex = filteredEmployees.findIndex(e => e.id === selectedEmployee.id);
                                        if (currentIndex > 0) setSelectedEmployee(filteredEmployees[currentIndex - 1]);
                                    }}
                                    disabled={!filteredEmployees.find(e => e.id === selectedEmployee.id) || filteredEmployees.findIndex(e => e.id === selectedEmployee.id) === 0}
                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="px-5 py-1.5 bg-[#ffcc4d]/5 rounded-xl border border-[#ffcc4d]/10">
                                    <p className="text-[9px] font-black text-[#ffcc4d] uppercase tracking-[0.2em]">
                                        {selectedEmployee.fullName}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        const currentIndex = filteredEmployees.findIndex(e => e.id === selectedEmployee.id);
                                        if (currentIndex < filteredEmployees.length - 1) setSelectedEmployee(filteredEmployees[currentIndex + 1]);
                                    }}
                                    disabled={!filteredEmployees.find(e => e.id === selectedEmployee.id) || filteredEmployees.findIndex(e => e.id === selectedEmployee.id) === filteredEmployees.length - 1}
                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar bg-[#080808]/30 relative z-10">
                        {selectedEmployee ? (
                            <div className="w-full h-full">
                                <BulletinPaieDocument
                                    employee={selectedEmployee}
                                    calculations={calculatePayroll(selectedEmployee, {
                                        conge: selectedEmployee.conge,
                                        absence: selectedEmployee.absence,
                                        jf: selectedEmployee.jf,
                                        avance: selectedEmployee.avance
                                    })}
                                    company={currentCompany}
                                    period={`${new Date().toLocaleString('fr-FR', { month: 'long' })} ${new Date().getFullYear()}`}
                                    refreshKey={imageRefreshKey}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-xs mx-auto text-center opacity-40">
                                <div className="w-20 h-20 bg-[#1a1a1a] border border-white/5 rounded-[2rem] flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">{t('selectionRequired')}</h4>
                                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">{t('chooseProfile')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PayrollEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                employee={selectedEmployee}
                onSave={handleSaveRow}
            />
        </div>
    );
}
