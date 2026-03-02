'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { BookOpen, Clock, AlertCircle } from 'lucide-react'

export default function HomeworkPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/homework/${id}`)
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const isOverdue = (due: string) => new Date(due) < new Date()

  return (
    <PortalPage title="Homework">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No homework assigned</p>
          <p className="text-gray-400 text-sm mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(hw => (
            <div key={hw.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {hw.subject}
                    </span>
                    {isOverdue(hw.due_date) && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800">{hw.title}</h3>
                  {hw.description && <p className="text-sm text-gray-500 mt-1">{hw.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Due: <strong className={isOverdue(hw.due_date) ? 'text-red-500' : 'text-gray-700'}>{hw.due_date}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
