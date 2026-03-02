'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const subjectColors: Record<string,string> = {
  Mathematics: 'bg-blue-100 text-blue-700',
  Science: 'bg-green-100 text-green-700',
  English: 'bg-purple-100 text-purple-700',
  Hindi: 'bg-orange-100 text-orange-700',
  History: 'bg-yellow-100 text-yellow-700',
  Geography: 'bg-teal-100 text-teal-700',
  default: 'bg-gray-100 text-gray-700',
}

export default function ClassTimetablePage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday')

  useEffect(() => {
    if (!id) return
    api.get(`/portal/timetable/${id}`)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const byDay = (day: string) => entries.filter(e => e.day === day).sort((a, b) => a.period - b.period)
  const getColor = (subject: string) => subjectColors[subject] || subjectColors.default

  return (
    <PortalPage title="Class Timetable">
      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {DAYS.map(day => (
          <button key={day}
            onClick={() => setActiveDay(day)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${activeDay === day ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {day.slice(0,3)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : byDay(activeDay).length === 0 ? (
        <div className="text-center py-12 text-gray-400">No classes on {activeDay}</div>
      ) : (
        <div className="space-y-3">
          {byDay(activeDay).map(e => (
            <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-indigo-600 font-bold text-sm">{e.period}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getColor(e.subject)}`}>
                    {e.subject}
                  </span>
                  {e.room && <span className="text-xs text-gray-400">Room {e.room}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">👨‍🏫 {e.teacher || 'TBA'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-gray-700">{e.start_time}</p>
                <p className="text-xs text-gray-400">{e.end_time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
