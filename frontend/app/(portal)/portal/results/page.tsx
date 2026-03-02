'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { BarChart2, Award, AlertCircle } from 'lucide-react'

export default function ResultsPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/results/${id}`).then(r => setResults(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const gradeColor: Record<string,string> = {
    'A+':'text-green-600 bg-green-100', 'A':'text-green-600 bg-green-100',
    'B+':'text-blue-600 bg-blue-100', 'B':'text-blue-600 bg-blue-100',
    'C':'text-yellow-600 bg-yellow-100', 'D':'text-orange-600 bg-orange-100',
    'F':'text-red-600 bg-red-100',
  }

  return (
    <PortalPage title="Results">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : results.length === 0 ? (
        <div className="text-center py-16"><BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No results available yet</p></div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{r.exam_name}</h3>
                  <p className="text-sm text-indigo-600">{r.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.exam_date}</p>
                </div>
                {r.is_absent ? (
                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                    <AlertCircle className="w-3 h-3" /> Absent
                  </span>
                ) : (
                  <div className="text-right">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${gradeColor[r.grade] || 'bg-gray-100 text-gray-600'}`}>
                      {r.grade || '—'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{r.marks} / {r.total_marks}</p>
                  </div>
                )}
              </div>
              {r.remarks && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">💬 {r.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
