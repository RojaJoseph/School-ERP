'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { MessageSquare } from 'lucide-react'

const typeColor: Record<string,string> = {
  general:    'bg-blue-100 text-blue-700',
  behaviour:  'bg-orange-100 text-orange-700',
  academic:   'bg-green-100 text-green-700',
  attendance: 'bg-red-100 text-red-700',
}
const typeEmoji: Record<string,string> = {
  general: '📝', behaviour: '🤝', academic: '📚', attendance: '✅'
}

export default function RemarksPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [remarks, setRemarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/remarks/${id}`).then(r => setRemarks(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  return (
    <PortalPage title="Student Remarks">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : remarks.length === 0 ? (
        <div className="text-center py-16"><MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No remarks from teachers</p></div>
      ) : (
        <div className="space-y-3">
          {remarks.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{typeEmoji[r.remark_type] || '📝'}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[r.remark_type] || 'bg-gray-100 text-gray-600'}`}>
                  {r.remark_type}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.remark}</p>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
