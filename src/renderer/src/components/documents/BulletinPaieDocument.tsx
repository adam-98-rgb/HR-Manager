import { useState, useMemo } from 'react';
import { PayrollCalculations, calculatePayroll } from '../../lib/payrollUtils';
import { getIsFemale } from '../../lib/utils';

interface BulletinPaieDocumentProps {
    employee: any;
    calculations: PayrollCalculations;
    company: any;
    period: string;
    refreshKey?: number;
}

export default function BulletinPaieDocument({ employee, calculations: initialCalculations, company, period, refreshKey }: BulletinPaieDocumentProps) {
    const [overrideRate, setOverrideRate] = useState<number | undefined>(undefined);

    // Initialize motif from employee data: if it's "Démission" use it, otherwise default to "Licenciement"
    const getInitialMotif = () => {
        if (employee.motif === 'Démission') return 'Démission';
        if (employee.motif === 'Licenciement') return 'Licenciement';
        if (employee.motif === 'Licenciement Art41') return 'Licenciement Art41';
        // For any other value or missing motif, default to Licenciement
        return employee.motif === 'Démission' ? 'Démission' : 'Licenciement';
    };

    const [motif, setMotif] = useState(getInitialMotif());

    const calculations = useMemo(() => {
        if (overrideRate === undefined) {
            return calculatePayroll(employee, {
                conge: employee.conge || 0,
                absence: employee.absence || 0,
                jf: employee.jf || 0,
                avance: employee.avance || 0,
                motif: motif
            });
        }
        return calculatePayroll(employee, {
            conge: employee.conge || 0,
            absence: employee.absence || 0,
            jf: employee.jf || 0,
            avance: employee.avance || 0,
            primeAncienneteOverride: overrideRate,
            motif: motif
        });
    }, [employee, initialCalculations, overrideRate, motif]);

    const calculateSimpleSeniority = (startDate: string) => {
        if (!startDate) return '0 an(s) et 0 mois';
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return '0 an(s) et 0 mois';
        const end = employee.status === 'Sortie' && employee.dateSortie ? new Date(employee.dateSortie) : new Date();

        // Month-based logic: inclusive
        const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        return `${years} an(s) et ${months} mois`;
    };

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

    // Calculate working days for Sortie employees from start of month to quit date
    const calculateWorkingDaysForSortie = (dateSortie: string): number => {
        if (!dateSortie) return 26; // fallback

        // Parse date - handle both ISO format (YYYY-MM-DD) and other formats
        const quitDate = new Date(dateSortie);

        // Validate date
        if (isNaN(quitDate.getTime())) {
            console.error('Invalid dateSortie:', dateSortie);
            return 26;
        }

        const year = quitDate.getFullYear();
        const month = quitDate.getMonth();
        const lastDayOfWork = quitDate.getDate();

        console.log('Calculating working days:', {
            dateSortie,
            quitDate: quitDate.toISOString(),
            year,
            month: month + 1, // Display as 1-12
            lastDayOfWork
        });

        let workingDays = 0;
        const dayDetails: string[] = [];

        for (let day = 1; day <= lastDayOfWork; day++) {
            const currentDate = new Date(year, month, day);
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            const isSunday = dayOfWeek === 0;

            dayDetails.push(`Day ${day}: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]} ${isSunday ? '❌' : '✅'}`);

            if (!isSunday) {
                workingDays++;
            }
        }

        console.log('Working days breakdown:', dayDetails);
        console.log('Total working days:', workingDays);

        return workingDays;
    };

    // Format period for Sortie employees (e.g., "FÉVRIER 2026")
    const formatPeriod = (): string => {
        if (employee.status === 'Sortie' && employee.dateSortie) {
            const quitDate = new Date(employee.dateSortie);
            const monthNames = [
                'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
                'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
            ];
            return `${monthNames[quitDate.getMonth()]} ${quitDate.getFullYear()}`;
        }
        return period; // Use default period for active employees
    };

    const workingDaysForDisplay = employee.status === 'Sortie' && employee.dateSortie
        ? calculateWorkingDaysForSortie(employee.dateSortie)
        : 26;

    const seniorityStr = calculateSimpleSeniority(employee.dateAnciennete || employee.dateEmbauche || employee.empDateAnciennete);

    const isFemale = getIsFemale(employee.gender || employee.empGender);
    const defaultIcon = `/icons/${isFemale ? 'female.png' : 'male.png'}`;
    const photoUrl = employee.avatar || employee.photo || employee.empAvatar;

    return (
        <div className="bg-white text-slate-800 p-4 pb-0 font-sans relative flex flex-col min-h-full" style={{ width: '100%', margin: '0' }}>
            {/* 3D Background Elements - Subtle */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ffcc4d]" />

            {/* Compact Header */}
            <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-1">
                <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-100 p-0.5 bg-slate-50 overflow-hidden shadow-sm shrink-0">
                        {photoUrl ? (
                            <img
                                src={getImageUrl(photoUrl)}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = defaultIcon;
                                }}
                            />
                        ) : (
                            <img
                                src={defaultIcon}
                                alt=""
                                className="w-full h-full object-cover rounded-lg opacity-80"
                            />
                        )}
                    </div>
                    <div>
                        <h2 className="text-[16px] font-black text-slate-900 uppercase leading-tight mb-1">
                            {employee.fullName || employee.empFullName}
                        </h2>
                        <div className="space-y-0 text-[11px] font-bold text-slate-500 uppercase tracking-tight">

                            <p className="text-slate-400">Matricule: #{employee.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[#ffcc4d] font-black">Statut: {employee.status || 'Active'}</p>
                            </div>
                            {employee.status === 'Sortie' && (
                                <div className="flex items-center gap-1 mt-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setMotif('Démission')}
                                        className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${motif === 'Démission'
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        Démission
                                    </button>
                                    <button
                                        onClick={() => setMotif('Licenciement')}
                                        className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${motif === 'Licenciement'
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        Licenciement
                                    </button>
                                    <button
                                        onClick={() => setMotif('Licenciement Art41')}
                                        className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded transition-all ${motif === 'Licenciement Art41'
                                            ? 'bg-red-500 text-white shadow-sm'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        Art41
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-[13px] font-black text-slate-900 uppercase tracking-widest border-b-2 border-[#ffcc4d] inline-block mb-1">
                        {company?.name || 'ENTREPRISE'}
                    </h1>
                    <div className="space-y-0 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <p>Période: {formatPeriod()}</p>

                        <p>
                            Ancienneté: {(() => {
                                const match = seniorityStr.match(/(\d+) an\(s\) et (\d+) mois/);
                                if (match) {
                                    const years = parseInt(match[1]);
                                    const months = parseInt(match[2]);
                                    const milestones = [2, 5, 12, 20];

                                    if (milestones.includes(years)) {
                                        if (months === 0) {
                                            return <span className="text-green-600 font-bold">{seniorityStr}</span>;
                                        } else if (months === 1) {
                                            return <span className="text-red-500 font-bold">{seniorityStr}</span>;
                                        }
                                    }
                                }
                                return seniorityStr;
                            })()}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3D Data Grid */}
            <div className="mb-0 flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-widest">
                            <th className="py-3 px-6 pl-6 text-left w-[70%]">Désignation</th>
                            <th className="py-3 px-4 text-right w-[6%]">Nombre</th>
                            <th className="py-3 px-4 text-right w-[6%]">Base</th>
                            <th className="py-3 px-4 text-right w-[6%]">Taux%</th>
                            <th className="py-3 px-4 text-right w-[6%]">Gain</th>
                            <th className="py-3 px-4 text-right text-red-500 w-[6%]">Retenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px]">
                        {/* 1. Salaire Base */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Salaire Base</p>
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{calculations.daysWorked}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.salaire_base?.toFixed(3)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">
                                {calculations.salaireBaseGain.toFixed(2)}
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* 2. Congés Payés */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Congés Payés</p>
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.conge || 0}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.salaire_base?.toFixed(3)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">{calculations.congeGain.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* Indemnité de Préavis */}
                        {employee.status === 'Sortie' && calculations.preavisAmount && calculations.preavisAmount > 0 ? (
                            <tr className="group hover:bg-yellow-50/50 transition-colors bg-yellow-50/30 border-l-2 border-yellow-400">
                                <td className="py-[6px] px-6">
                                    <p className="font-black text-yellow-800 uppercase">Indemnité de Préavis</p>
                                </td>
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">{calculations.preavisDays}</td>
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">{employee.salaire_base?.toFixed(3)}</td>
                                <td className="py-[6px] px-4 text-right"></td>
                                <td className="py-[6px] px-4 text-right font-black text-yellow-900">{calculations.preavisAmount.toFixed(2)}</td>
                                <td className="py-[6px] px-4 text-right"></td>
                            </tr>
                        ) : null}

                        {/* 3. Jour férié */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Jour férié</p>
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.jf || 0}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.salaire_base?.toFixed(3)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">{calculations.feriesGain.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* 4. Prime d'Ancienneté */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Prime d'Ancienneté</p>
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">
                                {calculations.primeAncienneteBase.toFixed(3)}
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">
                                <select
                                    value={overrideRate ?? calculations.primeAncienneteRate}
                                    onChange={(e) => setOverrideRate(parseInt(e.target.value))}
                                    className="bg-transparent border-none text-right font-bold text-slate-400 focus:ring-0 cursor-pointer p-0 hover:text-slate-900 transition-colors"
                                >
                                    {[0, 5, 10, 15, 20].map(rate => (
                                        <option key={rate} value={rate}>{rate}%</option>
                                    ))}
                                </select>
                            </td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">{calculations.primeAncienneteGain.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* 5. Prime de Rendement */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Prime de Rendement</p>
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{calculations.bonusDays}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.prime_rendement?.toFixed(3)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">{calculations.primeRendementGain.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* Dommages-Intérêts */}
                        {employee.status === 'Sortie' && calculations.dommagesAmount && calculations.dommagesAmount > 0 ? (
                            <tr className="group hover:bg-yellow-50/50 transition-colors bg-yellow-50/30 border-l-2 border-yellow-400">
                                <td className="py-[6px] px-6">
                                    <p className="font-black text-yellow-800 uppercase">Dommages-Intérêts</p>
                                </td>
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">{calculations.dommagesDays?.toFixed(1)}</td>
                                {/* Base is approximate for display or we can calculate it: Amount / Days */}
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">
                                    {calculations.dommagesDays ? (calculations.dommagesAmount / calculations.dommagesDays).toFixed(2) : '0.00'}
                                </td>
                                <td className="py-[6px] px-4 text-right"></td>
                                <td className="py-[6px] px-4 text-right font-black text-yellow-900">{calculations.dommagesAmount.toFixed(2)}</td>
                                <td className="py-[6px] px-4 text-right"></td>
                            </tr>
                        ) : null}

                        {/* Indemnité de Licenciement */}
                        {employee.status === 'Sortie' && calculations.licenciementAmount && calculations.licenciementAmount > 0 ? (
                            <tr className="group hover:bg-yellow-50/50 transition-colors bg-yellow-50/30 border-l-2 border-yellow-400">
                                <td className="py-[6px] px-6">
                                    <p className="font-black text-yellow-800 uppercase">Indemnité de Licenciement</p>
                                </td>
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">{calculations.licenciementHours}H</td>
                                <td className="py-[6px] px-4 text-right font-bold text-yellow-700">
                                    {calculations.licenciementHours ? (calculations.licenciementAmount / calculations.licenciementHours).toFixed(2) : '0.00'}
                                </td>
                                <td className="py-[6px] px-4 text-right"></td>
                                <td className="py-[6px] px-4 text-right font-black text-yellow-900">{calculations.licenciementAmount.toFixed(2)}</td>
                                <td className="py-[6px] px-4 text-right"></td>
                            </tr>
                        ) : null}

                        {/* 6. Indemnité de Panier */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-black text-slate-900 uppercase">Indemnité de Panier</p>
                            </td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{calculations.bonusDays}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-500">{employee.indemnite_panier?.toFixed(3)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-slate-700">{calculations.indemnitePanierGain.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* 7. Total Brut */}
                        <tr className="bg-slate-900/5 font-black text-slate-900 border-y border-slate-900/10 text-[12px]">
                            <td className="py-[6px] px-6 uppercase italic">Total Brut</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-900">{calculations.salaireBrut.toFixed(2)}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                        </tr>

                        {/* 8. Cotisation CNSS */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-bold text-slate-500 uppercase">Cotisation CNSS</p>
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">{calculations.cnssBase?.toFixed(3) || Math.min(calculations.salaireBrutImposable, 6000).toLocaleString()}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">4.48%</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-red-500">{calculations.cnssAmount.toFixed(2)}</td>
                        </tr>

                        {/* 9. Cotisation AMO */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-bold text-slate-500 uppercase">Cotisation AMO</p>
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">{calculations.salaireBrutImposable.toLocaleString()}</td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">2.26%</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-red-500">{calculations.amoAmount.toFixed(2)}</td>
                        </tr>

                        {/* Total Cotisations */}
                        <tr className="bg-slate-900/5 font-black text-slate-900 border-y border-slate-900/10 text-[12px]">
                            <td className="py-[6px] px-6 uppercase italic">Total Cotisations</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-red-500">{(calculations.cnssAmount + calculations.amoAmount).toFixed(2)}</td>
                        </tr>

                        {/* 10. Prélèvement IGR */}
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-[6px] px-6">
                                <p className="font-bold text-slate-500 uppercase">Prélèvement IGR</p>
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-bold text-slate-400">{calculations.netImposable.toLocaleString()}</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-red-500">{calculations.finalIgr.toFixed(2)}</td>
                        </tr>


                        {/* 12. Avance */}
                        <tr className="group hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                            <td className="py-[6px] px-6">
                                <p className="font-bold text-slate-900 uppercase">Avance</p>
                            </td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right font-black text-red-500">{(employee.avance || 0).toFixed(2)}</td>
                        </tr>

                        <tr className="bg-slate-50/30 italic border-b border-slate-100">
                            <td className="py-[6px] px-6 font-bold text-slate-900 uppercase text-[10px]">Arrondi du mois</td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className="py-[6px] px-4 text-right"></td>
                            <td className={`py-[6px] px-4 text-right font-bold text-[10px] italic ${calculations.arrondi < 0 ? 'text-green-500' : 'text-red-500'}`}>{calculations.arrondi.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Minimal Spacer */}
            <div className="h-1" />

            {/* Finalized High-Density Footer Row */}
            <div className="bg-slate-900 text-white rounded-t-2xl shadow-xl overflow-hidden mt-auto">
                <div className="flex divide-x divide-white/5 items-stretch">
                    {/* Metrics in a row (Left/Center) */}
                    <div className="flex-1 grid grid-cols-3 lg:grid-cols-5 divide-x divide-white/5">
                        <div className="p-3 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">Brut Imposable</p>
                            <p className="text-[14px] font-black tabular-nums">{calculations.salaireBrutImposable.toFixed(3)}</p>
                        </div>
                        <div className="p-4 flex flex-col justify-center border-t lg:border-t-0 border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">Net Imposable</p>
                            <p className="text-[14px] font-black tabular-nums">{calculations.netImposable.toFixed(3)}</p>
                        </div>
                        <div className="p-4 flex flex-col justify-center border-t lg:border-t-0 border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">Fr. Profession.</p>
                            <p className="text-[14px] font-black tabular-nums">{calculations.fraisProfessionnels.toFixed(2)}</p>
                        </div>
                        <div className="p-4 flex flex-col justify-center border-t lg:border-t-0 border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">IGR</p>
                            <p className="text-[14px] font-black tabular-nums">{calculations.finalIgr.toFixed(2)}</p>
                        </div>
                        <div className="p-3 flex flex-col justify-center border-t lg:border-t-0 border-white/5 bg-white/[0.02]">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Jrs Trav.</span>
                                    <span className="text-[13px] font-black text-[#ffcc4d]">{calculations.bonusDays}</span>
                                </div>
                                <div className="h-[1px] bg-white/10 w-full" />
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Num Déd.</span>
                                    <span className="text-[13px] font-black text-[#ffcc4d]">{employee.num_deduction || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net à Payer - Most Prominent (Right) */}
                    <div className="bg-[#ffcc4d] p-4 flex flex-col justify-center min-w-[150px]">
                        <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-none">Net à Payer</p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                            {calculations.netAPayer.toFixed(2)} <span className="text-[10px]">DH</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Subtle Footer */}
            <div className="flex justify-between items-center opacity-30 mt-1 pb-1 px-4">
                <p className="text-[6.5px] font-bold text-slate-300 tracking-[0.4em] uppercase">Document Certifié Conforme</p>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                </div>
            </div>
        </div>
    );
}
