import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ label, value, icon: Icon, color, change, trend }: StatsCardProps) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {change && (
          <p className={`text-xs mt-0.5 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  )
}
