import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Employee } from '../data/mockData'

interface DeleteConfirmModalProps {
    employee: Employee | null
    isOpen: boolean
    onClose: () => void
    onConfirm: (id: string) => void
}

export default function DeleteConfirmModal({ employee, isOpen, onClose, onConfirm }: DeleteConfirmModalProps): JSX.Element {
    if (!employee) return <></>

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[#1e1e1e] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 text-center border border-white/10"
                    >
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2 font-['Outfit']">Delete Employee?</h2>
                        <p className="text-slate-400 font-medium mb-8">
                            Are you sure you want to delete <span className="text-white font-bold">{employee.fullName}</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm(employee.id)
                                    onClose()
                                }}
                                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
