'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { FolderOpen, Clock } from 'lucide-react'

export default function ProjectsPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/projects/${id}`).then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const isOverdue = (due: string) => new Date(due) < new Date()
  const daysLeft = (due: string) => {
    const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Overdue'
    if (diff === 0) return 'Due Today!'
    return `${diff} days left`
  }

  return (
    <PortalPage title="Projects">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16"><FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No projects assigned</p></div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{p.subject}</span>
                  <h3 className="font-semibold text-gray-800 mt-1">{p.title}</h3>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${isOverdue(p.due_date) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {daysLeft(p.due_date)}
                </span>
              </div>
              {p.guidelines && (
                <div className="mt-3 bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">📋 Guidelines</p>
                  <p className="text-xs text-amber-600">{p.guidelines}</p>
                </div>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> Due: {p.due_date}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
