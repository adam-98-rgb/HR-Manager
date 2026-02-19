import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Info, X, Check } from 'lucide-react';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    type: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export default function AlertDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}: AlertDialogProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <Trash2 className="w-6 h-6 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-[#ffcc4d]" />;
            case 'info': return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'danger': return {
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                button: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
                iconBg: 'bg-red-500/20'
            };
            case 'warning': return {
                bg: 'bg-[#ffcc4d]/5',
                border: 'border-[#ffcc4d]/20',
                button: 'bg-[#ffcc4d] hover:bg-[#ffdb70] text-[#1e1e1e] font-bold shadow-lg shadow-[#ffcc4d]/20',
                iconBg: 'bg-[#ffcc4d]/20'
            };
            case 'info': return {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20',
                iconBg: 'bg-blue-500/20'
            };
        }
    };

    const styles = getStyles();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`relative w-full max-w-md bg-[#1e1e1e] rounded-3xl border ${styles.border} shadow-2xl overflow-hidden transition-all duration-300 transform ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
            >
                {/* Header Pattern */}
                <div className={`absolute top-0 left-0 right-0 h-32 ${styles.bg} opacity-50`} />

                <div className="relative p-8 flex flex-col items-center text-center gap-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${styles.iconBg} flex items-center justify-center shadow-inner mb-2`}>
                        {getIcon()}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white">{title}</h3>
                        <div className="text-sm text-white/50 leading-relaxed font-medium">
                            {message}
                        </div>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-white/60 font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${styles.button}`}
                        >
                            {type === 'danger' && <Trash2 className="w-4 h-4" />}
                            {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
