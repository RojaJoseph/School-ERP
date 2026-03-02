import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {message && <p className="text-sm text-gray-400 mt-1 max-w-xs">{message}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4">
          {action.label}
        </button>
      )}
    </div>
  )
}
