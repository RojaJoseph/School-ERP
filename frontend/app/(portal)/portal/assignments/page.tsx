'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { ClipboardCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function AssignmentsPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'pending'|'submitted'>('all')

  useEffect(() => {
    if (!id) return
    api.get(`/portal/assignments/${id}`).then(r => setAssignments(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const isOverdue = (due: string) => new Date(due) < new Date()
  const filtered = filter === 'all' ? assignments
    : filter === 'submitted' ? assignments.filter(a => a.submitted)
    : assignments.filter(a => !a.submitted)

  return (
    <PortalPage title="Assignments">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all','pending','submitted'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
              ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No assignments found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{a.subject}</span>
                    {a.submitted ? (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Submitted
                      </span>
                    ) : isOverdue(a.due_date) ? (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  {a.description && <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>}
                </div>
                {a.grade && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-indigo-600">{a.grade}</p>
                    {a.score && <p className="text-xs text-gray-400">{a.score} pts</p>}
                  </div>
                )}
              </div>
              {a.feedback && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">💬 {a.feedback}</p>}
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> Due: <span className={isOverdue(a.due_date) && !a.submitted ? 'text-red-500 font-semibold' : ''}>{a.due_date}</span>
                {a.submitted_at && <span className="ml-3">✅ Submitted: {new Date(a.submitted_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
