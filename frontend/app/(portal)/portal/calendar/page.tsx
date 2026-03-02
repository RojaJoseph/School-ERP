'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { Calendar } from 'lucide-react'

const typeConfig: Record<string,{color:string,emoji:string}> = {
  holiday: { color:'bg-red-100 text-red-700', emoji:'🏖️' },
  exam:    { color:'bg-orange-100 text-orange-700', emoji:'📝' },
  event:   { color:'bg-blue-100 text-blue-700', emoji:'🎉' },
  meeting: { color:'bg-purple-100 text-purple-700', emoji:'👥' },
}

export default function CalendarPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/calendar/${id}`).then(r => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  return (
    <PortalPage title="Calendar">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No events scheduled</p></div>
      ) : (
        <div className="space-y-3">
          {events.map(e => {
            const cfg = typeConfig[e.event_type] || { color:'bg-gray-100 text-gray-700', emoji:'📅' }
            return (
              <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4">
                <div className="text-2xl">{cfg.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{e.event_type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{e.title}</h3>
                  {e.description && <p className="text-sm text-gray-500 mt-0.5">{e.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">📅 {e.event_date}{e.end_date && e.end_date !== e.event_date ? ` → ${e.end_date}` : ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PortalPage>
  )
}
