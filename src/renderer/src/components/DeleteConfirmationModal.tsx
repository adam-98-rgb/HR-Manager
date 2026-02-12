import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    itemName: string
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message, itemName }: DeleteConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1e1e1e] p-8 rounded-3xl w-full max-w-md border border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                            <p className="text-slate-400 text-sm">
                                {message} <span className="text-white font-bold">{itemName}</span>?
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
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
