import { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

interface StatsCardProps {
    icon: LucideIcon
    label: string
    value: string | number
    subValue?: string
    color: string
}

export default function StatsCard({ icon: Icon, label, value, subValue, color }: StatsCardProps): JSX.Element {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110", color)}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-800 font-['Outfit']">{value}</h3>
                    {subValue && (
                        <span className="text-xs font-medium text-slate-400">{subValue}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
