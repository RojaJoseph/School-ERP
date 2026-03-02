import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface Action {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: Action[]
  children?: ReactNode
}

const variantClass = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
}

export default function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
        {actions?.map((action, i) => {
          const Icon = action.icon
          const cls  = variantClass[action.variant || 'primary']
          if (action.href) {
            return (
              <a key={i} href={action.href} className={cls}>
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
              </a>
            )
          }
          return (
            <button key={i} onClick={action.onClick} className={cls}>
              {Icon && <Icon className="w-4 h-4" />}
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
