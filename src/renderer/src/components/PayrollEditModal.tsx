import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';

interface PayrollEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    onSave: (data: any) => void;
}

export default function PayrollEditModal({ isOpen, onClose, employee, onSave }: PayrollEditModalProps) {
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (employee) {
            const data = { ...employee };
            // Convert numbers to strings for editing to allow decimal point entry
            ['salaire_base', 'prime_rendement', 'indemnite_panier', 'num_deduction', 'conge', 'absence', 'jf', 'avance'].forEach(field => {
                if (data[field] !== undefined && data[field] !== null) {
                    data[field] = data[field].toString();
                } else {
                    data[field] = '0';
                }
            });
            setFormData(data);
        }
    }, [employee]);

    if (!formData) return null;

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const parsedData = { ...formData };
        // Parse strings back to numbers for saving
        ['salaire_base', 'prime_rendement', 'indemnite_panier', 'num_deduction', 'conge', 'absence', 'jf', 'avance'].forEach(field => {
            if (typeof parsedData[field] === 'string') {
                const normalized = parsedData[field].replace(',', '.');
                parsedData[field] = parseFloat(normalized) || 0;
            }
        });
        onSave(parsedData);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[300]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-[#1e1e1e] border border-white/10 p-8 shadow-2xl transition-all">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-[#ffcc4d]/10 rounded-2xl text-[#ffcc4d]">
                                            <Calculator className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-xl font-bold text-white">
                                                Modifier Paie
                                            </Dialog.Title>
                                            <p className="text-sm text-slate-400 font-medium">#{formData.id} - {formData.fullName}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Financial Basics */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Financière</h4>
                                        <InputField label="Salaire de Base" value={formData.salaire_base} onChange={v => handleChange('salaire_base', v)} />
                                        <InputField label="Prime Rendement" value={formData.prime_rendement} onChange={v => handleChange('prime_rendement', v)} />
                                        <InputField label="Indemnité Panier" value={formData.indemnite_panier} onChange={v => handleChange('indemnite_panier', v)} />
                                        <InputField label="N° Déductions" value={formData.num_deduction} onChange={v => handleChange('num_deduction', v)} isInt />
                                    </div>

                                    {/* Monthly Variables */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Variables du mois</h4>
                                        <InputField label="Congé" value={formData.conge} onChange={v => handleChange('conge', v)} />
                                        <InputField label="Absence" value={formData.absence} onChange={v => handleChange('absence', v)} className="text-red-400" />
                                        <InputField label="Jours Fériés (JF)" value={formData.jf} onChange={v => handleChange('jf', v)} />
                                        <InputField label="Avance" value={formData.avance} onChange={v => handleChange('avance', v)} className="text-blue-400" />
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-8 py-3 bg-[#ffcc4d] hover:bg-[#e6b800] text-[#1e1e1e] rounded-2xl text-sm font-black transition-all shadow-lg shadow-[#ffcc4d]/20"
                                    >
                                        <Save className="w-4 h-4" />
                                        Enregistrer
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function InputField({ label, value, onChange, className = "", isInt = false }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
            <input
                type="text"
                inputMode="decimal"
                value={value || 0}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-white/5 border border-white/5 focus:border-[#ffcc4d]/50 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none transition-all ${className}`}
            />
        </div>
    );
}
