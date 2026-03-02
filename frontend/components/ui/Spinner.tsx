import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

export function Spinner({ size = 'md', className, text }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizes[size])} />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" text="Loading..." />
    </div>
  )
}
