'use client'
import { useState } from 'react'
import { Download, FileText, Sheet, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  onExportPDF:   () => Promise<void>
  onExportExcel: () => Promise<void>
  disabled?: boolean
}

export default function ExportButton({ onExportPDF, onExportExcel, disabled }: ExportButtonProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState<'pdf'|'excel'|null>(null)

  const handle = async (type: 'pdf' | 'excel') => {
    setLoading(type)
    setOpen(false)
    try {
      if (type === 'pdf')   await onExportPDF()
      else                  await onExportExcel()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        disabled={disabled || !!loading}
        onClick={() => setOpen(o => !o)}
        className="btn-secondary"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 text-sm">
            <button
              onClick={() => handle('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" /> Export as PDF
            </button>
            <button
              onClick={() => handle('excel')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 text-gray-700 hover:text-green-600 transition-colors"
            >
              <Sheet className="w-4 h-4 text-green-500" /> Export as Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
