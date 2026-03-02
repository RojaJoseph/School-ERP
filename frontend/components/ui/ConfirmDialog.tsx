'use client'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const variantStyles = {
  danger:  { icon: 'bg-red-100 text-red-600',    btn: 'bg-red-600 hover:bg-red-700 text-white' },
  warning: { icon: 'bg-yellow-100 text-yellow-600', btn: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  info:    { icon: 'bg-blue-100 text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Confirm Action', message,
  confirmLabel = 'Confirm', variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant]
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${styles.btn}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.icon}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 pt-2">{message}</p>
      </div>
    </Modal>
  )
}
