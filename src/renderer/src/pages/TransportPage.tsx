import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Truck, Database, Map, Plus, Edit2, Trash2, Download, Search, Check, X, ClipboardList, Settings2, Users, FileSpreadsheet, Upload, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { TransportEmployee, TransportGroup, parsePlanningData, generateTrajet, TrajetBlock, PlanningItem, excelSerialToDate, TrajetTransformationData, parseTrajetData } from '../utils/transportUtils';
import * as XLSX from 'xlsx';
import AlertDialog from '../components/AlertDialog';

export default function TransportPage() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'config' | 'trajet' | 'transform'>('config');
    const [employees, setEmployees] = useState<TransportEmployee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentEmp, setCurrentEmp] = useState<TransportEmployee | null>(null);
    const [planningText, setPlanningText] = useState('');
    const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
    const [planningDates, setPlanningDates] = useState<string[]>([]);
    const [generatedTrajets, setGeneratedTrajets] = useState<TrajetBlock[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<0 | 1 | 3 | 5>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [excelPreview, setExcelPreview] = useState<any[][] | null>(null);

    // Transformation State
    const [transformationData, setTransformationData] = useState<TrajetTransformationData | null>(null);
    const [selectedAreasForTransform, setSelectedAreasForTransform] = useState<string[]>([]);
    const [selectedTrajetKeys, setSelectedTrajetKeys] = useState<string[]>([]); // "address|||time"
    const [transformFileName, setTransformFileName] = useState<string | null>(null);
    const transformFileInputRef = useRef<HTMLInputElement>(null);

    //Manual selections state: { [periodIndex]: string[] } (array of IDs)
    const [manualSelections, setManualSelections] = useState<{ [key: number]: string[] }>({
        0: [], 1: [], 3: [], 5: []
    });

    // Groups state
    const [groups, setGroups] = useState<TransportGroup[]>([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<TransportGroup | null>(null);
    const [newGroup, setNewGroup] = useState<Partial<TransportGroup>>({
        name: '',
        shift: '9H',
        mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false
    });

    // New Employee Form State
    const [newEmp, setNewEmp] = useState<Partial<TransportEmployee>>({
        fullName: '',
        address: '',
        phone: '',
        lieu: '',
        isMotorise: false,
        isSpecial: false,
        specialGroup: '',
        specialShift: '9H',
        mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false
    });

    // Alert Dialog State
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });

    useEffect(() => {
        loadEmployees();
        loadGroups();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await window.api.db.getTransportEmployees();
            // Convert numbers/nulls to proper booleans/strings
            const formatted = data.map(emp => ({
                ...emp,
                isMotorise: !!emp.isMotorise,
                isSpecial: !!emp.isSpecial,
                mon: !!emp.mon, tue: !!emp.tue, wed: !!emp.wed, thu: !!emp.thu, fri: !!emp.fri, sat: !!emp.sat, sun: !!emp.sun,
                specialShift: emp.specialShift || '9H'
            }));
            setEmployees(formatted);
        } catch (error) {
            console.error('Failed to load transport employees:', error);
        }
    };

    const loadGroups = async () => {
        try {
            const data = await window.api.db.getTransportGroups();
            const formatted = data.map(grp => ({
                ...grp,
                mon: !!grp.mon, tue: !!grp.tue, wed: !!grp.wed,
                thu: !!grp.thu, fri: !!grp.fri, sat: !!grp.sat, sun: !!grp.sun
            }));
            setGroups(formatted);
        } catch (error) {
            console.error('Failed to load groups:', error);
        }
    };

    const handleToggleBoolean = async (emp: TransportEmployee, field: keyof TransportEmployee) => {
        if (!emp.id) return;
        const updatedEmp = { ...emp, [field]: !emp[field] };
        try {
            await window.api.db.updateTransportEmployee({ id: emp.id, emp: updatedEmp });
            loadEmployees();
        } catch (error) {
            console.error(`Failed to toggle ${field}:`, error);
        }
    };
    const getConflictOverlaps = (emp: any) => {
        if (!emp.isSpecial || !emp.specialGroup) return null;
        const group = groups.find(g => g.name === emp.specialGroup);
        if (!group) return null;

        const dayFields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const overlaps: string[] = [];

        dayFields.forEach((field, i) => {
            if (group[field] && emp[field]) {
                overlaps.push(dayNames[i]);
            }
        });
        return overlaps.length > 0 ? { groupName: group.name, overlaps } : null;
    };

    const handleAddEmployee = async () => {
        if (!newEmp.fullName) return;

        const executeAdd = async () => {
            try {
                await window.api.db.addTransportEmployee(newEmp);
                setIsAddModalOpen(false);
                setNewEmp({
                    fullName: '', address: '', phone: '', lieu: '', isMotorise: false, isSpecial: false, specialGroup: '',
                    specialShift: '9H',
                    mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false
                });
                loadEmployees();
            } catch (error) {
                console.error('Failed to add employee:', error);
            }
        };

        const conflict = getConflictOverlaps(newEmp);
        if (conflict) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: '⚠️ Overlap Conflict',
                message: (
                    <div className="text-left">
                        <p>Employee's personal working days overlap with group <span className="text-[#ffcc4d] font-bold">"{conflict.groupName}"</span> on:</p>
                        <ul className="list-disc list-inside mt-2 mb-2 text-white/80 font-bold">
                            {conflict.overlaps.map(d => <li key={d}>{d}</li>)}
                        </ul>
                        <p>Personal days and Group days should be mutually exclusive.</p>
                        <p className="mt-2 text-white/60 text-xs">Do you want to proceed anyway?</p>
                    </div>
                ),
                confirmText: 'Add Anyway',
                onConfirm: executeAdd
            });
            return;
        }

        executeAdd();
    };


    const handleUpdateEmployee = async () => {
        if (!currentEmp || !currentEmp.id) return;

        const executeUpdate = async () => {
            try {
                await window.api.db.updateTransportEmployee({ id: currentEmp.id, emp: currentEmp });
                setIsEditModalOpen(false);
                setCurrentEmp(null);
                loadEmployees();
            } catch (error) {
                console.error('Failed to update employee:', error);
            }
        };

        const conflict = getConflictOverlaps(currentEmp);
        if (conflict) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: '⚠️ Overlap Conflict',
                message: (
                    <div className="text-left">
                        <p>Employee's personal working days overlap with group <span className="text-[#ffcc4d] font-bold">"{conflict.groupName}"</span> on:</p>
                        <ul className="list-disc list-inside mt-2 mb-2 text-white/80 font-bold">
                            {conflict.overlaps.map(d => <li key={d}>{d}</li>)}
                        </ul>
                        <p>Personal days and Group days should be mutually exclusive.</p>
                        <p className="mt-2 text-white/60 text-xs">Do you want to proceed anyway?</p>
                    </div>
                ),
                confirmText: 'Update Anyway',
                onConfirm: executeUpdate
            });
            return;
        }

        executeUpdate();
    };

    const handleDeleteEmployee = async (id: number) => {
        setAlertState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Employee',
            message: 'Are you sure you want to delete this employee? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await window.api.db.deleteTransportEmployee(id);
                    loadEmployees();
                } catch (error) {
                    console.error('Failed to delete employee:', error);
                }
            }
        });
    };

    // Group CRUD Handlers
    const handleAddGroup = async () => {
        if (!newGroup.name || !newGroup.shift) return;
        try {
            await window.api.db.addTransportGroup({ group: newGroup });
            setIsGroupModalOpen(false);
            setNewGroup({ name: '', shift: '9H', mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false });
            loadGroups();
        } catch (error) {
            console.error('Failed to add group:', error);
        }
    };

    const handleUpdateGroup = async () => {
        if (!currentGroup || !currentGroup.id) return;
        try {
            await window.api.db.updateTransportGroup({ id: currentGroup.id, group: currentGroup });
            setIsGroupModalOpen(false);
            setCurrentGroup(null);
            loadGroups();
        } catch (error) {
            console.error('Failed to update group:', error);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        setAlertState({
            isOpen: true,
            type: 'danger',
            title: 'Delete Group',
            message: 'Are you sure you want to delete this group? All assigned employees will be unassigned.',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await window.api.db.deleteTransportGroup(id);
                    loadGroups();
                } catch (error) {
                    console.error('Failed to delete group:', error);
                }
            }
        });
    };

    const handleProcessPlanning = () => {
        if (!planningText) return;
        const items = parsePlanningData(planningText);

        // Validation: Check for unknown names
        const unknownNames = items.items
            .map(i => i.name)
            .filter(name => !employees.some(e => e.fullName.toLowerCase() === name.toLowerCase()));

        const proceed = () => {
            setPlanningItems(items.items);
            setPlanningDates(items.dates);
            setActiveTab('trajet');
        }

        if (unknownNames.length > 0) {
            setAlertState({
                isOpen: true,
                type: 'warning',
                title: 'Unknown Employees Detected',
                message: (
                    <div className="text-left">
                        <p>The following names in the uploaded Excel file do not match any employee in the database:</p>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar my-3 bg-black/20 p-3 rounded-lg border border-white/5">
                            <ul className="text-xs space-y-1">
                                {unknownNames.map((name, idx) => (
                                    <li key={idx} className="text-[#ffcc4d] font-mono">• {name}</li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-xs text-white/50">These entries will be ignored in the generated Trajet.</p>
                        <p className="mt-2 text-white/80 font-bold">Do you want to continue?</p>
                    </div>
                ),
                confirmText: 'Continue',
                onConfirm: proceed
            });
            return;
        }

        proceed();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            // Generate full table preview with empty cells preserved
            const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            setExcelPreview(json as any[][]);

            // Convert worksheet to TSV-like text for the generator
            const data = XLSX.utils.sheet_to_txt(ws, { RS: '\n', FS: '\t' });
            setPlanningText(data);

            // Reset input value to allow selecting the same file again
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const dayNames = useMemo(() => {
        return (window as any).language === 'fr' || (typeof useLanguage !== 'undefined' && language === 'fr')
            ? ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }, [language]);

    useEffect(() => {
        if (planningItems.length > 0 || Object.values(manualSelections).some(arr => arr.length > 0) || employees.some(e => e.isSpecial)) {
            const trajet = generateTrajet(selectedPeriod, planningItems, employees, groups, manualSelections[selectedPeriod] || [], dayNames, planningDates);
            setGeneratedTrajets(trajet);
        }
    }, [selectedPeriod, planningItems, planningDates, employees, manualSelections, groups, dayNames]);

    const exportToExcel = () => {
        if (generatedTrajets.length === 0) return;

        const wb = XLSX.utils.book_new();
        const wsData: any[][] = [];

        // Calculate max rows needed for any location
        const maxRows = Math.max(...generatedTrajets.map(b => b.employees.length));

        // Title row (spans all columns)
        wsData.push([`Trajet - ${dayNames[selectedPeriod]}${generatedTrajets[0].day2Name ? ' / ' + generatedTrajets[0].day2Name : ''}`]);
        wsData.push([]); // Empty row

        // Build header row with all locations
        const headerRow: any[] = [];
        generatedTrajets.forEach((block, idx) => {
            headerRow.push(block.lieu);
            headerRow.push('');
            headerRow.push('');
            headerRow.push('');
            headerRow.push('');
            if (idx < generatedTrajets.length - 1) {
                headerRow.push(''); // Separator column
            }
        });
        wsData.push(headerRow);

        // Column headers for each location
        const colHeaderRow: any[] = [];
        generatedTrajets.forEach((block, idx) => {
            colHeaderRow.push('Nom & Prénom');
            colHeaderRow.push('Adresse');
            colHeaderRow.push('Phone');
            colHeaderRow.push(block.day1Name);
            colHeaderRow.push(block.day2Name || '');
            if (idx < generatedTrajets.length - 1) {
                colHeaderRow.push(''); // Separator column
            }
        });
        wsData.push(colHeaderRow);

        // Employee data rows (side-by-side)
        for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
            const dataRow: any[] = [];
            generatedTrajets.forEach((block, blockIdx) => {
                const emp = block.employees[rowIdx];
                if (emp) {
                    dataRow.push(emp.name);
                    dataRow.push(emp.address);
                    dataRow.push(emp.phone);
                    dataRow.push(emp.shift1 || '');
                    dataRow.push(emp.shift2 || '');
                } else {
                    dataRow.push('', '', '', '', ''); // Empty cells if no employee
                }
                if (blockIdx < generatedTrajets.length - 1) {
                    dataRow.push(''); // Separator column
                }
            });
            wsData.push(dataRow);
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths: any[] = [];
        generatedTrajets.forEach((_, idx) => {
            colWidths.push({ wch: 20 }); // Staff Member
            colWidths.push({ wch: 25 }); // Logistic Details
            colWidths.push({ wch: 15 }); // Phone
            colWidths.push({ wch: 8 });  // Day 1
            colWidths.push({ wch: 8 });  // Day 2
            if (idx < generatedTrajets.length - 1) {
                colWidths.push({ wch: 2 }); // Separator
            }
        });
        ws['!cols'] = colWidths;

        // Add merged cells and styling
        const merges: any[] = [];

        // Merge title row
        const totalCols = generatedTrajets.length * 5 + (generatedTrajets.length - 1);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });

        // Merge location headers (row 2)
        let colOffset = 0;
        generatedTrajets.forEach((_, idx) => {
            merges.push({ s: { r: 2, c: colOffset }, e: { r: 2, c: colOffset + 4 } });
            colOffset += (idx < generatedTrajets.length - 1) ? 6 : 5; // 5 columns + 1 separator (except last)
        });

        ws['!merges'] = merges;

        // Apply cell styling
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;

                const cell = ws[cellAddress];
                cell.s = cell.s || {};

                // Title row (row 0) - Yellow background, bold, centered
                if (R === 0) {
                    cell.s = {
                        font: { bold: true, sz: 14, color: { rgb: '000000' } },
                        fill: { fgColor: { rgb: 'FFCC4D' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: {
                            top: { style: 'thin', color: { rgb: '000000' } },
                            bottom: { style: 'thin', color: { rgb: '000000' } },
                            left: { style: 'thin', color: { rgb: '000000' } },
                            right: { style: 'thin', color: { rgb: '000000' } }
                        }
                    };
                }

                // Location headers (row 2) - Light yellow, bold, centered
                if (R === 2) {
                    cell.s = {
                        font: { bold: true, sz: 12 },
                        fill: { fgColor: { rgb: 'FFF4CC' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    };
                }

                // Column headers (row 3) - Gray background, bold
                if (R === 3) {
                    cell.s = {
                        font: { bold: true, sz: 10 },
                        fill: { fgColor: { rgb: 'D3D3D3' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    };
                }

                // Data rows - add borders
                if (R > 3) {
                    cell.s = {
                        border: {
                            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                            right: { style: 'thin', color: { rgb: 'E0E0E0' } }
                        }
                    };
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Trajet');

        const firstBlock = generatedTrajets[0];
        const dayPart = dayNames[selectedPeriod] + (firstBlock.day2Name ? `-${firstBlock.day2Name}` : '');

        const translateMonth = (dateStr?: string) => {
            if (!dateStr) return '';
            const monthsFr: { [key: string]: string } = {
                'Jan': 'Janvier', 'Feb': 'Février', 'Mar': 'Mars', 'Apr': 'Avril',
                'May': 'Mai', 'Jun': 'Juin', 'Jul': 'Juillet', 'Aug': 'Août',
                'Sep': 'Septembre', 'Oct': 'Octobre', 'Nov': 'Novembre', 'Dec': 'Décembre'
            };
            const parts = dateStr.split(/[-/]/);
            if (parts.length < 2) return dateStr;
            const day = parts[0];
            const monthShort = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
            return `${day} ${monthsFr[monthShort] || monthShort}`;
        };

        const datePart = firstBlock.day1Date ? translateMonth(firstBlock.day1Date) : '';
        const datePart2 = firstBlock.day2Date ? `-${translateMonth(firstBlock.day2Date)}` : '';
        const year = new Date().getFullYear();

        const fileName = `Trajet ${dayPart} ${datePart}${datePart2} ${year}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lieu.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group special employees for selection UI
    const specialEmployeeGroups = useMemo(() => {
        const groups: { [key: string]: TransportEmployee[] } = {};
        employees.filter(e => e.isSpecial && e.specialGroup).forEach(e => {
            const g = e.specialGroup!;
            if (!groups[g]) groups[g] = [];
            groups[g].push(e);
        });
        return groups;
    }, [employees]);

    const handleToggleManualSelection = (empId: string) => {
        const currentArr = manualSelections[selectedPeriod] || [];
        const isSelected = currentArr.includes(empId);

        if (isSelected) {
            setManualSelections({
                ...manualSelections,
                [selectedPeriod]: currentArr.filter(id => id !== empId)
            });
        } else {
            setManualSelections({
                ...manualSelections,
                [selectedPeriod]: [...currentArr, empId]
            });
        }
    };

    const DayCheckbox = ({ label, field, state, setState }: { label: string, field: keyof TransportEmployee, state: any, setState: any }) => (
        <div className="flex flex-col items-center gap-2 flex-1 p-2 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest group-hover:text-purple-400 transition-colors">{label}</span>
            <button
                onClick={() => setState({ ...state, [field]: !state[field] })}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${state[field]
                    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-110'
                    : 'bg-[#1a1a1a] border-white/5 text-white/10 hover:border-purple-500/20 hover:text-white/30'
                    }`}
            >
                {state[field] ? <Check className="w-5 h-5 stroke-[4px]" /> : <span className="text-[10px] font-bold">{label[0]}</span>}
            </button>
        </div>
    );

    const handleTransformFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTransformFileName(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];

            // Convert worksheet to TSV-like text for the generator
            const data = XLSX.utils.sheet_to_txt(ws, { RS: '\n', FS: '\t' });
            const parsedItems = parseTrajetData(data, employees);

            setTransformationData(parsedItems);

            // Default to ALL selected (user can unselect)
            const allTrajets = parsedItems.shiftGroups.flatMap((g, gIdx) =>
                g.trajets.map((_, tIdx) => `${gIdx}-${tIdx}`)
            );
            setSelectedTrajetKeys(allTrajets);
            setSelectedAreasForTransform([]);

            // Reset input value to allow selecting the same file again
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const toggleAreaTransform = (area: string) => {
        if (selectedAreasForTransform.includes(area)) {
            setSelectedAreasForTransform(prev => prev.filter(a => a !== area));
        } else {
            setSelectedAreasForTransform(prev => [...prev, area]);
        }
    };

    const toggleTrajetSelection = (key: string) => {
        setSelectedTrajetKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleGeneratePDF = () => {
        if (selectedAreasForTransform.length === 0) {
            setAlertState({
                isOpen: true,
                title: 'Label Manquant',
                message: 'Veuillez sélectionner un Lieu dans le "Label de Lieu" à gauche avant de générer le rapport PDF.',
                type: 'warning',
                onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false })),
                confirmText: 'Compris'
            });
            return;
        }

        const filename = transformFileName ? transformFileName.replace(/\.[^/.]+$/, "") + ".pdf" : (transformationData?.mainTitle || 'Trajet_Report') + ".pdf";
        window.api.file.printToPDF({ filename });
    };

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden bg-[#1e1e1e] print:p-0 print:bg-white print:overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#ffcc4d] to-[#ffb300] rounded-2xl shadow-xl shadow-[#ffcc4d]/20">
                        <Truck className="w-8 h-8 text-[#1e1e1e]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
                            {t('transport')}
                        </h1>
                        <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mt-1">Fleet & Logistics Suite</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'config' ? 'bg-[#ffcc4d] text-[#1e1e1e] font-black shadow-lg shadow-[#ffcc4d]/20' : 'text-white/40 hover:text-white font-bold'}`}
                    >
                        <Settings2 className="w-4 h-4" />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('trajet')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'trajet' ? 'bg-[#ffcc4d] text-[#1e1e1e] font-black shadow-lg shadow-[#ffcc4d]/20' : 'text-white/40 hover:text-white font-bold'}`}
                    >
                        <Map className="w-4 h-4" />
                        {t('trajetArea')}
                    </button>
                    <button
                        onClick={() => setActiveTab('transform')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'transform' ? 'bg-[#ffcc4d] text-[#1e1e1e] font-black shadow-lg shadow-[#ffcc4d]/20' : 'text-white/40 hover:text-white font-bold'}`}
                    >
                        <Map className="w-4 h-4" />
                        Transformation Trajet
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'config' && (
                    <div className="h-full flex flex-col gap-6">
                        <div className="flex gap-6 flex-1 overflow-hidden">
                            {/* Database Section */}
                            <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <div className="flex-1 relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#ffcc4d] transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t('searchEmployees')}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#ffcc4d]/50 transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsGroupModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
                                    >
                                        <Users className="w-4 h-4" />
                                        Groups
                                    </button>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#ffcc4d] text-[#1e1e1e] font-black rounded-2xl hover:bg-[#e6b800] transition-all shadow-lg shadow-[#ffcc4d]/20 active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {t('add')}
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto custom-scrollbar bg-white/5 rounded-3xl border border-white/10">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-[#262626] border-b border-white/10 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{t('fullName')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{t('lieu')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">{t('isMotorise')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Special</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredEmployees.map(emp => (
                                                <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-white text-sm">{emp.fullName}</div>
                                                        <div className="text-[10px] text-white/30 truncate max-w-[200px]">{emp.address}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-black text-[#ffcc4d] border border-white/10 uppercase tracking-tighter">
                                                            {emp.lieu}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleBoolean(emp, 'isMotorise')}
                                                            className={`w-10 h-5 rounded-full transition-all relative inline-block align-middle ${emp.isMotorise ? 'bg-[#ffcc4d]' : 'bg-white/10'}`}
                                                        >
                                                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${emp.isMotorise ? 'right-1 bg-[#1e1e1e]' : 'left-1 bg-white/40'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <button
                                                                onClick={() => handleToggleBoolean(emp, 'isSpecial')}
                                                                className={`w-10 h-5 rounded-full transition-all relative inline-block align-middle ${emp.isSpecial ? 'bg-purple-500' : 'bg-white/10'}`}
                                                            >
                                                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${emp.isSpecial ? 'right-1 bg-[#1e1e1e]' : 'left-1 bg-white/40'}`} />
                                                            </button>
                                                            {emp.isSpecial && (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="flex gap-0.5 mt-1">
                                                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                                            const fields: (keyof TransportEmployee)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                                            return (
                                                                                <span key={i} className={`text-[7px] font-black w-2 h-2 flex items-center justify-center rounded-xs ${emp[fields[i]] ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/10'}`}>{day}</span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-purple-400 mt-1 uppercase tracking-tighter">{emp.specialShift}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setCurrentEmp(emp); setIsEditModalOpen(true); }}
                                                                className="p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => emp.id && handleDeleteEmployee(emp.id)}
                                                                className="p-1.5 text-white/40 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Planning Section Area */}
                            <div className="flex-[2] flex flex-col gap-4 bg-[#262626] rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-[#ffcc4d]" />
                                        <h2 className="text-white font-black uppercase text-xs tracking-widest">{t('planningArea')}</h2>
                                    </div>
                                    <div className="px-2 py-0.5 bg-[#ffcc4d]/10 rounded border border-[#ffcc4d]/20 text-[8px] font-black text-[#ffcc4d] uppercase letter-widest">Excel Table</div>
                                </div>

                                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                    {/* Excel Upload Box */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-28 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#ffcc4d]/30 hover:bg-white/5 transition-all cursor-pointer group shrink-0"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".xlsx, .xls"
                                            className="hidden"
                                        />
                                        <Upload className="w-5 h-5 text-white/20 group-hover:text-[#ffcc4d] transition-colors" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">
                                            {fileName || 'Upload Planning Excel'}
                                        </p>
                                    </div>

                                    <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                                        {excelPreview ? (
                                            <div className="flex-1 overflow-auto custom-scrollbar">
                                                <table className="w-full text-[9px] border-collapse">
                                                    <tbody>
                                                        {excelPreview.slice(0, 100).filter(row => {
                                                            // Skip completely empty rows
                                                            return row.some(cell => cell !== '' && cell !== null && cell !== undefined);
                                                        }).map((row, i) => {
                                                            const isWeekHeader = row.some(c => typeof c === 'string' && c.toLowerCase().includes('week'));
                                                            const isDateHeader = row.some(c => typeof c === 'number' && c > 40000);

                                                            return (
                                                                <tr key={i} className={`border-b border-white/[0.02] hover:bg-white/[0.02] ${isWeekHeader || isDateHeader ? 'sticky top-0 z-10' : ''}`}>
                                                                    {row.slice(0, 15).map((cell, j) => {
                                                                        let cellClass = "px-2 py-2 border-r border-white/5 text-white/40 whitespace-nowrap overflow-hidden max-w-[150px] truncate";
                                                                        let displayValue = cell;

                                                                        if (isWeekHeader) {
                                                                            cellClass = "px-4 py-3 border-r border-white/10 bg-[#ffcc4d] text-[#1e1e1e] font-black uppercase text-[11px]";
                                                                            // Attempt to fuse/span columns? This is a simple grid so we just style.
                                                                        } else if (isDateHeader) {
                                                                            cellClass = "px-2 py-2 border-r border-white/10 bg-white/5 text-white/80 font-black text-center text-[10px]";
                                                                            if (typeof cell === 'number' && cell > 40000) {
                                                                                displayValue = excelSerialToDate(cell);
                                                                            }
                                                                        } else if (j === 0 && cell && !isWeekHeader && !isDateHeader) {
                                                                            cellClass = "px-3 py-2 border-r border-white/10 text-white font-black bg-white/[0.03]";
                                                                        }

                                                                        return (
                                                                            <td key={j} className={cellClass}>
                                                                                {displayValue}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/10 p-8 text-center">
                                                <FileSpreadsheet className="w-12 h-12 opacity-50" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Upload a file to see preview</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleProcessPlanning}
                                    disabled={!planningText}
                                    className={`w-full py-4 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${planningText ? 'bg-[#ffcc4d] text-[#1e1e1e] hover:bg-[#e6b800] shadow-[#ffcc4d]/20' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
                                >
                                    <Map className="w-5 h-5" />
                                    {t('generateTrajet')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'trajet' && (
                    <div className="h-full flex flex-col gap-6 overflow-hidden">
                        {/* Unified Trajet Toolbar */}
                        <div className="flex flex-col gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10 shadow-xl">
                            <div className="flex flex-wrap items-center gap-6">
                                {/* Days Selection */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Selected Period</span>
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                        {[0, 1, 3, 5].map((period) => (
                                            <button
                                                key={period}
                                                onClick={() => setSelectedPeriod(period as any)}
                                                className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${selectedPeriod === period ? 'bg-[#ffcc4d] text-[#1e1e1e] shadow-lg shadow-[#ffcc4d]/20' : 'text-white/40 hover:text-white'}`}
                                            >
                                                {period === 0 ? t('periodMon') : period === 1 ? 'Mar/Mer' : period === 3 ? 'Jeu/Ven' : 'Sam/Dim'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div className="hidden md:block w-px h-12 bg-white/10 self-end mb-2" />

                                {/* Group Toggles (Filtered by Period Activity) */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Active Groups & Members</span>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {Object.entries(specialEmployeeGroups).filter(([groupName]) => {
                                            const group = groups.find(g => g.name === groupName);
                                            if (!group) return false;
                                            const dayFields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                            // Check if group is active on ANY day of the selected period
                                            const isPeriodActive = !!group[dayFields[selectedPeriod]] || (selectedPeriod > 0 && !!group[dayFields[selectedPeriod + 1]]);
                                            return isPeriodActive;
                                        }).map(([group, members]) => (
                                            <div key={group} className="flex items-center gap-2 bg-purple-500/5 p-1 rounded-2xl border border-purple-500/20">
                                                <div className="px-3 py-1.5 text-[9px] font-black uppercase text-purple-400 tracking-tighter bg-purple-500/10 rounded-lg">🛡️ {group}</div>
                                                <div className="flex gap-1.5 pr-1">
                                                    {members.map(emp => {
                                                        const id = emp.id?.toString() || '';
                                                        const isSelected = (manualSelections[selectedPeriod] || []).includes(id);
                                                        return (
                                                            <button
                                                                key={id}
                                                                onClick={() => handleToggleManualSelection(id)}
                                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border flex items-center gap-2 ${isSelected ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white/30 border-white/5 hover:border-white/10'}`}
                                                            >
                                                                {isSelected ? <Check className="w-2.5 h-2.5" /> : <div className="w-2.5 h-2.5 rounded-sm border border-white/10" />}
                                                                {emp.fullName}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.entries(specialEmployeeGroups).filter(([groupName]) => {
                                            const group = groups.find(g => g.name === groupName);
                                            if (!group) return false;
                                            const dayFields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                            const isPeriodActive = !!group[dayFields[selectedPeriod]] || (selectedPeriod > 0 && !!group[dayFields[selectedPeriod + 1]]);
                                            return isPeriodActive;
                                        }).length === 0 && (
                                                <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] italic">No active groups for this period</span>
                                            )}
                                    </div>
                                </div>

                                <button
                                    onClick={exportToExcel}
                                    className="self-end mb-1 flex items-center gap-3 px-8 py-3 bg-[#ffcc4d] text-[#1e1e1e] font-black rounded-2xl hover:bg-[#ffcc4d]/90 transition-all border border-[#ffcc4d]/20 active:scale-95 shadow-lg"
                                >
                                    <Download className="w-5 h-5" />
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Trajet Grid (Excel Style Tables) */}
                        <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {generatedTrajets.map((block, idx) => (
                                    <div key={idx} className="bg-[#1e1e1e]/50 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden print:border-black print:bg-white print:shadow-none h-fit">
                                        {/* Table Header / Lieu */}
                                        <div className="bg-[#ffcc4d] px-6 py-3 flex justify-between items-center print:bg-gray-100 print:border-b print:border-black">
                                            <h3 className="text-[#1e1e1e] font-black uppercase text-sm tracking-[0.2em]">{block.lieu}</h3>
                                            <div className="flex gap-6 items-center">
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-black text-[#1e1e1e]/40 uppercase tracking-tighter">{block.day1Name}</span>
                                                    {block.day2Name && <span className="text-[10px] font-black text-[#1e1e1e]/40 uppercase tracking-tighter border-l border-[#1e1e1e]/20 pl-2">{block.day2Name}</span>}
                                                </div>
                                                <div className="bg-[#1e1e1e]/10 px-3 py-1 rounded-full border border-[#1e1e1e]/5">
                                                    <span className="text-[10px] font-black text-[#1e1e1e] uppercase">Qty: {block.employees.length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/[0.03] border-b border-white/10 print:bg-white print:border-black">
                                                        <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border-r border-white/5 print:text-black print:border-black min-w-[120px]">Nom & Prénom</th>
                                                        <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border-r border-white/5 print:text-black print:border-black">Adresse</th>
                                                        <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border-r border-white/5 print:text-black print:border-black">Phone</th>
                                                        <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center border-r border-white/5 print:text-black print:border-black min-w-[70px]">{block.day1Name}</th>
                                                        <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center print:text-black print:border-black min-w-[70px]">{block.day2Name || '-'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 print:divide-black">
                                                    {block.employees.map((e, i) => (
                                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group/row print:bg-white">
                                                            <td className="px-6 py-4 border-r border-white/5 print:border-black">
                                                                <span className="font-black text-white text-[11px] uppercase tracking-tight group-hover/row:text-[#ffcc4d] transition-colors print:text-black">
                                                                    {e.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 border-r border-white/5 print:border-black">
                                                                <span className="text-[10px] text-white/40 font-medium line-clamp-1 print:text-black">
                                                                    {e.address}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 border-r border-white/5 print:border-black">
                                                                <span className="text-[10px] text-white/60 font-mono print:text-black">
                                                                    {e.phone}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center border-r border-white/5 print:border-black">
                                                                <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] ${e.shift1 ? 'bg-[#ffcc4d] text-[#1e1e1e] font-black shadow-lg shadow-[#ffcc4d]/10' : 'text-white/5 print:text-transparent'}`}>
                                                                    {e.shift1 || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center print:border-black">
                                                                <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] ${e.shift2 ? 'bg-[#ffcc4d] text-[#1e1e1e] font-black shadow-lg shadow-[#ffcc4d]/10' : 'text-white/5 print:text-transparent'}`}>
                                                                    {e.shift2 || '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transform' && (
                    <div className="h-full flex flex-col gap-6 print:block print:h-auto">
                        <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2rem] border border-white/10 print:hidden">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                    <FileSpreadsheet className="w-8 h-8 text-purple-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Transformation Trajet</h3>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Privacy-Mode Logistics</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="file"
                                    ref={transformFileInputRef}
                                    onChange={handleTransformFileUpload}
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                />
                                <button
                                    onClick={() => transformFileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all active:scale-95 shadow-lg"
                                >
                                    <Upload className="w-5 h-5" />
                                    Charger Trajet DATA
                                </button>
                                {transformationData && (
                                    <button
                                        onClick={handleGeneratePDF}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-[#ffcc4d] text-[#1e1e1e] font-black rounded-2xl hover:bg-[#ffb300] transition-all active:scale-95 shadow-xl shadow-[#ffcc4d]/20"
                                    >
                                        <Download className="w-5 h-5" />
                                        Générer PDF
                                    </button>
                                )}
                            </div>
                        </div>

                        {transformationData ? (
                            <div className="flex-1 flex gap-6 overflow-hidden print:block print:overflow-visible">
                                {/* Zone Selection Sidebar (Label Reference) */}
                                <div className="w-72 bg-white/5 p-6 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col print:hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Label de Lieu</h4>
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Map className="w-4 h-4 text-purple-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {Array.from(new Set(employees.map(e => e.lieu))).sort().filter(l => l && l !== 'Unknown').map(lieu => (
                                            <button
                                                key={lieu}
                                                onClick={() => setSelectedAreasForTransform([lieu])}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${selectedAreasForTransform.includes(lieu)
                                                    ? 'bg-purple-500/20 border-purple-500/40 text-white'
                                                    : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-sm font-bold tracking-tight">{lieu}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAreasForTransform.includes(lieu)
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-white/10'
                                                    }`}>
                                                    {selectedAreasForTransform.includes(lieu) && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center leading-relaxed">
                                            Le lieu sélectionné servira de label pour le rapport final.
                                        </p>
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col print:bg-white print:border-none print:m-0 print:rounded-none">
                                    <div className="p-8 border-b border-white/10 flex items-center justify-between print:hidden">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-[#ffcc4d] uppercase tracking-[0.3em] print:text-black">
                                                {transformationData.mainTitle || 'Logistics Summary'}
                                            </h4>
                                            <p className="text-white/40 text-xs font-medium print:text-black">
                                                Structure originale préservée • Anonymisation Activée
                                                {selectedAreasForTransform.length > 0 && ` • Lieu: ${selectedAreasForTransform[0]}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-black text-sm print:text-black">
                                                {transformationData.shiftGroups.reduce((acc, g) => acc + g.trajets.reduce((at, t) => at + t.rows.length, 0), 0)} Personnes
                                            </p>
                                            <p className="text-white/30 text-[10px] font-bold uppercase print:text-black opacity-40">Récapitulatif Trajet</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pr-4 print:p-0">
                                        <div className="space-y-12 print:space-y-4">
                                            {transformationData.shiftGroups.map((group, gIdx) => (
                                                <div key={gIdx} className="space-y-8 animate-fade-in print:break-inside-avoid print:space-y-2">
                                                    {/* Shift Header */}
                                                    <div className="flex items-center gap-4 py-3 bg-white/5 rounded-2xl px-6 border-l-4 border-purple-500 print:bg-slate-200 print:border-[0.01pt] print:border-black print:px-2 print:py-0.5 print:rounded-none print:gap-1 print:mb-1 print:justify-center">
                                                        <Calendar className="w-5 h-5 text-purple-400 print:text-black print:w-2.5 print:h-2.5" />
                                                        <h5 className="text-lg font-black text-white tracking-widest print:text-black print:text-[10px] print:tracking-tight">{group.shiftTime}</h5>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12 print:grid-cols-2 print:gap-x-4 print:gap-y-6 print:mt-1">
                                                        {group.trajets.map((trajet, tIdx) => {
                                                            const trajetKey = `${gIdx}-${tIdx}`;
                                                            const isSelected = selectedTrajetKeys.includes(trajetKey);

                                                            // Group rows by address + time for the "Effectif" view
                                                            const trajetSummary: { [key: string]: { address: string, time: string, count: number } } = {};
                                                            trajet.rows.forEach(row => {
                                                                const key = `${row.address}|||${row.time}`;
                                                                if (!trajetSummary[key]) {
                                                                    trajetSummary[key] = { address: row.address, time: row.time, count: 0 };
                                                                }
                                                                trajetSummary[key].count++;
                                                            });

                                                            return (
                                                                <div key={tIdx} className={`space-y-4 print:space-y-0 print:break-inside-avoid ${!isSelected ? 'opacity-40 grayscale no-print' : ''}`}>
                                                                    <div className="flex items-center justify-between border-b border-white/5 pb-2 print:bg-slate-100 print:border-[0.01pt] print:border-black print:px-2 print:py-2 print:mb-1 print:relative">
                                                                        <div className="print:hidden">
                                                                            <button
                                                                                onClick={() => toggleTrajetSelection(trajetKey)}
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                                                                                    }`}
                                                                            >
                                                                                {isSelected && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                                                                            </button>
                                                                        </div>

                                                                        {/* Centered Title for Print */}
                                                                        <div className="flex-1 flex justify-center">
                                                                            <h6 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] print:text-black print:text-[8px] print:tracking-normal">{trajet.title}</h6>
                                                                        </div>

                                                                        {/* Right-aligned Effectifs for Print */}
                                                                        <div className="flex items-center gap-1 print:absolute print:right-2">
                                                                            <Users className="hidden print:block w-3.5 h-3.5 text-[#7C3AED]" />
                                                                            <span className="text-[10px] font-bold text-white/20 print:text-[#7C3AED] print:text-[8px] opacity-40 print:opacity-100">{trajet.rows.length} Effectifs</span>
                                                                        </div>
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="space-y-[1px] print:space-y-0">
                                                                            {/* Table Header */}
                                                                            <div className="grid grid-cols-12 gap-1 px-4 py-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 print:text-black print:border-b-[0.01pt] print:border-black print:text-[7px] print:px-0 print:py-2.5 print:bg-slate-200 print:mt-1 print:gap-0">
                                                                                <div className="col-span-2 print:pl-3">Local</div>
                                                                                <div className="col-span-6">Adresse</div>
                                                                                <div className="col-span-2 text-center">Heure</div>
                                                                                <div className="col-span-2 flex justify-center">Eff.</div>
                                                                            </div>

                                                                            {Object.values(trajetSummary).map((summary, sIdx) => (
                                                                                <div key={sIdx} className="grid grid-cols-12 gap-1 items-center p-3 bg-white/[0.02] rounded-xl border border-white/5 print:bg-white print:border-none print:rounded-none print:text-black print:p-0 hover:bg-white/[0.05] transition-all print:gap-0">
                                                                                    <div className="col-span-2 text-[10px] font-black text-[#ffcc4d] uppercase truncate print:text-[#A18200] print:text-[6.5px] print:font-black print:pl-3">
                                                                                        {selectedAreasForTransform[0] || '---'}
                                                                                    </div>
                                                                                    <div className="col-span-6 text-[12px] font-bold text-white/70 print:text-black print:text-[7.5px] print:font-medium leading-tight print:pr-1">
                                                                                        {summary.address}
                                                                                    </div>
                                                                                    <div className="col-span-2 text-center">
                                                                                        <div className="inline-block px-2 py-0.5 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black text-white/40 print:text-black print:border-[0.01pt] print:border-black print:text-[7px] print:px-1.5 print:py-0">
                                                                                            {summary.time}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-span-2 flex justify-center">
                                                                                        <div className="flex items-center gap-0.5 font-black text-purple-400 print:text-[#7C3AED] print:border-none print:text-[7.5px] h-full align-middle">
                                                                                            <Users className="w-3.5 h-3.5 print:w-3 print:h-3" />
                                                                                            <span className="leading-none">{summary.count}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
                                <div className="p-8 bg-purple-500/5 rounded-full mb-8 relative">
                                    <Upload className="w-16 h-16 text-purple-500/30" />
                                    <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping opacity-20" />
                                </div>
                                <h4 className="text-2xl font-black text-white/40 mb-3 tracking-tight">Aucun Trajet DATA chargé</h4>
                                <p className="text-white/20 text-center max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                                    Veuillez charger le fichier Excel fourni par la société de transport (Format Trajet DATA).
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#262626] border border-white/10 rounded-[32px] w-full max-w-4xl p-10 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-3">
                            <Plus className="w-8 h-8 text-[#ffcc4d]" />
                            {isAddModalOpen ? 'New Asset' : 'Refine Profile'}
                        </h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Principal Identity</label>
                                    <input
                                        type="text"
                                        value={isAddModalOpen ? newEmp.fullName : currentEmp?.fullName}
                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, fullName: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, fullName: e.target.value } : null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#ffcc4d]/50 focus:ring-4 focus:ring-[#ffcc4d]/10 transition-all font-bold"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Communication</label>
                                    <input
                                        type="text"
                                        value={isAddModalOpen ? newEmp.phone : currentEmp?.phone}
                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, phone: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, phone: e.target.value } : null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#ffcc4d]/50 transition-all font-bold"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Deployment Area</label>
                                    <input
                                        type="text"
                                        value={isAddModalOpen ? newEmp.lieu : currentEmp?.lieu}
                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, lieu: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, lieu: e.target.value } : null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#ffcc4d]/50 transition-all font-bold"
                                        placeholder="Lieu"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Adresse</label>
                                    <input
                                        type="text"
                                        value={isAddModalOpen ? newEmp.address : currentEmp?.address}
                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, address: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, address: e.target.value } : null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-[#ffcc4d]/50 transition-all font-bold"
                                        placeholder="Full Address"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#ffcc4d]/30 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Motorized</span>
                                        <span className="text-[10px] text-white/30 font-medium">Excludes from automatic trajet generation</span>
                                    </div>
                                    <button
                                        onClick={() => isAddModalOpen ? setNewEmp({ ...newEmp, isMotorise: !newEmp.isMotorise }) : setCurrentEmp(currentEmp ? { ...currentEmp, isMotorise: !currentEmp.isMotorise } : null)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${(isAddModalOpen ? newEmp.isMotorise : currentEmp?.isMotorise) ? 'bg-[#ffcc4d] shadow-[0_0_15px_rgba(255,204,77,0.4)]' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${(isAddModalOpen ? newEmp.isMotorise : currentEmp?.isMotorise) ? 'right-1 bg-white' : 'left-1 bg-white/40'}`} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Special Handling</span>
                                            <span className="text-[10px] text-white/30 font-medium">Manual inclusion & Grouping options</span>
                                        </div>
                                        <button
                                            onClick={() => isAddModalOpen ? setNewEmp({ ...newEmp, isSpecial: !newEmp.isSpecial }) : setCurrentEmp(currentEmp ? { ...currentEmp, isSpecial: !currentEmp.isSpecial } : null)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${(isAddModalOpen ? newEmp.isSpecial : currentEmp?.isSpecial) ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${(isAddModalOpen ? newEmp.isSpecial : currentEmp?.isSpecial) ? 'right-1 bg-white' : 'left-1 bg-white/40'}`} />
                                        </button>
                                    </div>

                                    {(isAddModalOpen ? newEmp.isSpecial : currentEmp?.isSpecial) && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Working Days</label>
                                                <div className="flex gap-2">
                                                    {isAddModalOpen ? (
                                                        <>
                                                            <DayCheckbox label="Mon" field="mon" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Tue" field="tue" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Wed" field="wed" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Thu" field="thu" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Fri" field="fri" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Sat" field="sat" state={newEmp} setState={setNewEmp} />
                                                            <DayCheckbox label="Sun" field="sun" state={newEmp} setState={setNewEmp} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DayCheckbox label="Mon" field="mon" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Tue" field="tue" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Wed" field="wed" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Thu" field="thu" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Fri" field="fri" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Sat" field="sat" state={currentEmp} setState={setCurrentEmp} />
                                                            <DayCheckbox label="Sun" field="sun" state={currentEmp} setState={setCurrentEmp} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Group Assignment</label>
                                                    <select
                                                        value={isAddModalOpen ? newEmp.specialGroup : currentEmp?.specialGroup || ''}
                                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, specialGroup: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, specialGroup: e.target.value } : null)}
                                                        className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-500/30"
                                                    >
                                                        <option value="">None</option>
                                                        {groups.map(g => (
                                                            <option key={g.id} value={g.name}>{g.name} ({g.shift})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Special Shift</label>
                                                    <select
                                                        value={isAddModalOpen ? newEmp.specialShift : currentEmp?.specialShift || '9H'}
                                                        onChange={(e) => isAddModalOpen ? setNewEmp({ ...newEmp, specialShift: e.target.value }) : setCurrentEmp(currentEmp ? { ...currentEmp, specialShift: e.target.value } : null)}
                                                        className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-500/30"
                                                    >
                                                        <option value="9H">9H</option>
                                                        <option value="11H">11H</option>
                                                        <option value="15H">15H</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-12">
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-3xl hover:bg-white/10 hover:text-white transition-all border border-white/5 tracking-widest uppercase text-xs"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={isAddModalOpen ? handleAddEmployee : handleUpdateEmployee}
                                className="flex-1 py-5 bg-[#ffcc4d] text-[#1e1e1e] font-black rounded-3xl hover:bg-[#e6b800] transition-all shadow-2xl shadow-[#ffcc4d]/30 active:scale-95 tracking-widest uppercase text-xs"
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Management Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e1e1e] rounded-3xl border border-white/10 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white tracking-tight">Manage Transport Groups</h2>
                            <button onClick={() => { setIsGroupModalOpen(false); setCurrentGroup(null); }} className="p-2 text-white/40 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Add New Group Section */}
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                                <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4">Create New Group</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Group Name</label>
                                        <input
                                            type="text"
                                            value={newGroup.name}
                                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500/30"
                                            placeholder="GROUPE NAME"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Shift/Timing</label>
                                        <select
                                            value={newGroup.shift}
                                            onChange={(e) => setNewGroup({ ...newGroup, shift: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500/30"
                                        >
                                            <option value="9H">9H</option>
                                            <option value="11H">11H</option>
                                            <option value="15H">15H</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Active Days</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                const fields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                                return (
                                                    <button
                                                        key={i}
                                                        title={fullDays[i]}
                                                        onClick={() => setNewGroup({ ...newGroup, [fields[i]]: !newGroup[fields[i]] })}
                                                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black rounded-full transition-all duration-300 border ${newGroup[fields[i]]
                                                            ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] scale-110'
                                                            : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:text-white/40'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddGroup}
                                    className="mt-4 px-6 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-all active:scale-95 text-xs flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Group
                                </button>
                            </div>

                            {/* Existing Groups List */}
                            <div>
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">Existing Groups</h3>
                                <div className="space-y-3">
                                    {groups.map(group => (
                                        <div key={group.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-white font-black text-sm min-w-[120px]">{group.name}</span>
                                                    <span className="px-3 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/30 text-[10px] font-black rounded-lg">{group.shift}</span>
                                                    <div className="flex gap-1.5">
                                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                            const fields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                            return (
                                                                <span
                                                                    key={i}
                                                                    className={`text-[8px] font-black w-6 h-6 flex items-center justify-center rounded-full border transition-all ${group[fields[i]]
                                                                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                                                                        : 'bg-white/5 border-transparent text-white/10'
                                                                        }`}
                                                                >
                                                                    {day}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id!)}
                                                className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {groups.length === 0 && (
                                        <div className="text-center py-12 text-white/20 text-sm italic">
                                            No transport groups defined yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-white/10">
                            <button
                                onClick={() => { setIsGroupModalOpen(false); setCurrentGroup(null); }}
                                className="w-full py-4 bg-white/5 text-white/60 font-black rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5 tracking-widest uppercase text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Alert Dialog */}
            <AlertDialog
                isOpen={alertState.isOpen}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                onConfirm={alertState.onConfirm}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                confirmText={alertState.confirmText}
            />
        </div>
    );
}
