import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X } from 'lucide-react'
import { PDFViewer } from '@react-pdf/renderer'
import { clsx } from 'clsx'

interface PDFPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    docContent: JSX.Element // Renamed from document
    isHtml?: boolean
}

export default function PDFPreviewModal({ isOpen, onClose, title = "Document Preview", docContent, isHtml = false }: PDFPreviewModalProps): JSX.Element {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[200]" onClose={onClose}>
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={clsx(
                                "transform overflow-hidden rounded-2xl bg-[#1e1e1e] border border-white/10 text-left align-middle shadow-xl transition-all flex flex-col h-[90vh]",
                                isHtml ? "w-full max-w-[210mm]" : "w-full max-w-6xl"
                            )}>
                                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1e1e1e]">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-white flex items-center gap-2">
                                        {title}
                                    </Dialog.Title>
                                    <div className="flex items-center gap-2">
                                        {isHtml && (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        const { jsPDF } = await import('jspdf');
                                                        const doc = new jsPDF({
                                                            format: 'a4',
                                                            unit: 'mm'
                                                        });

                                                        const pages = window.document.querySelectorAll('.page-container');

                                                        for (let i = 0; i < pages.length; i++) {
                                                            const page = pages[i] as HTMLElement;
                                                            if (i > 0) doc.addPage();

                                                            await doc.html(page, {
                                                                x: 0,
                                                                y: 0,
                                                                width: 210,
                                                                windowWidth: 800,
                                                                autoPaging: false // Manual paging per container
                                                            });
                                                        }

                                                        doc.save(title + '.pdf');
                                                    }}
                                                    className="px-4 py-2 bg-[#ffcc4d] text-[#1e1e1e] rounded-lg hover:bg-[#e6b800] transition-colors text-sm font-bold"
                                                >
                                                    Télécharger PDF
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-[#2a2a2a] overflow-auto flex justify-center">
                                    {isHtml ? (
                                        <div id="contract-content" className="w-[210mm] min-h-full bg-white text-black p-0 shadow-inner">
                                            {docContent}
                                        </div>
                                    ) : (
                                        <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                                            {docContent}
                                        </PDFViewer>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
