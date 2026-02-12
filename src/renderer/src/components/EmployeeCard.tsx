import { MoreHorizontal, X, Mail, Phone } from 'lucide-react'
import { Employee } from '../data/mockData'

interface EmployeeCardProps {
    employee: Employee
    onClick: () => void
    onEdit: (e: React.MouseEvent) => void
    onDelete: (e: React.MouseEvent) => void
}

export default function EmployeeCard({ employee, onClick, onEdit, onDelete }: EmployeeCardProps): JSX.Element {
    const getImageUrl = (path: string) => {
        if (!path) return ''
        if (path.startsWith('http') || path.startsWith('/storage') || path.startsWith('/icons')) return path
        if (path.includes(':') || path.startsWith('/') || path.startsWith('\\')) {
            return `file:///${path.replace(/\\/g, '/')}`
        }
        return path
    }

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#1e1e1e] hover:bg-[#252525] rounded-[24px] p-6 border border-white/5 hover:border-white/10 shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffcc4d]/0 to-[#ffcc4d]/0 group-hover:from-[#ffcc4d]/5 group-hover:to-transparent transition-all duration-500" />

            <div className="relative z-10 h-full flex flex-col">
                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                        className="p-2 bg-white/10 hover:bg-[#ffcc4d] rounded-xl transition-all text-white hover:text-black shadow-xl backdrop-blur-md"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                        className="p-2 bg-white/10 hover:bg-red-500 rounded-xl transition-all text-white hover:text-white shadow-xl backdrop-blur-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-start gap-6 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-1 shrink-0 ring-4 ring-white/5 group-hover:ring-[#ffcc4d]/20 transition-all duration-500">
                        {employee.photo ? (
                            <img
                                src={getImageUrl(employee.photo)}
                                alt={employee.fullName}
                                className="w-full h-full object-cover rounded-xl bg-white/5 scale-110 group-hover:scale-100 transition-transform duration-700"
                            />
                        ) : (
                            <img
                                src={getImageUrl(`/icons/${employee.gender === 'Female' ? 'female.png' : 'male.png'}`)}
                                alt={employee.fullName}
                                className="w-full h-full object-cover rounded-xl bg-white/5 opacity-80"
                            />
                        )}
                    </div>
                    <div className="flex flex-col justify-center h-20">
                        <span className="text-sm font-black text-[#ffcc4d] bg-[#ffcc4d]/10 px-3 py-1 rounded-lg uppercase tracking-wider shadow-inner inline-block w-fit">
                            {employee.id}
                        </span>
                    </div>
                </div>

                <div className="mb-4 text-center">
                    <h4 className="text-xl font-bold text-white group-hover:text-[#ffcc4d] transition-colors font-['Outfit'] tracking-tight leading-tight">
                        {employee.fullName}
                    </h4>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{employee.function}</p>
                </div>

                <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-[#ffcc4d]/60" />
                        </div>
                        <span className="truncate text-sm font-bold tracking-tight">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#ffcc4d]/60" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{employee.phone}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
