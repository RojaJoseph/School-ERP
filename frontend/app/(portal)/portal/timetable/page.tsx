'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { Calendar } from 'lucide-react'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const subjectColors: Record<string,string> = {
  Mathematics:'bg-blue-100 text-blue-800 border-blue-200',
  Science:    'bg-green-100 text-green-800 border-green-200',
  English:    'bg-purple-100 text-purple-800 border-purple-200',
  History:    'bg-orange-100 text-orange-800 border-orange-200',
  Geography:  'bg-teal-100 text-teal-800 border-teal-200',
  Tamil:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  Hindi:      'bg-red-100 text-red-800 border-red-200',
  'Physical Education': 'bg-indigo-100 text-indigo-800 border-indigo-200',
}
const getColor = (s: string) => subjectColors[s] || 'bg-gray-100 text-gray-800 border-gray-200'

export default function TimetablePage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalApi.get('/portal/timetable').then(r => setEntries(r.data)).finally(() => setLoading(false))
  }, [])

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = entries.filter(e => e.day_of_week === d).sort((a,b) => a.period_no - b.period_no)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <PortalPage title="Class Timetable">
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
      entries.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No timetable set yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => byDay[day]?.length > 0 && (
            <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5">
                <h3 className="text-white font-semibold text-sm">{day}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {byDay[day].map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-xs text-gray-400">P{entry.period_no}</p>
                    </div>
                    <div className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium ${getColor(entry.subject)}`}>
                      {entry.subject}
                      {entry.teacher_name && <span className="text-xs font-normal ml-2 opacity-70">• {entry.teacher_name}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{entry.start_time}</p>
                      <p className="text-xs text-gray-400">{entry.end_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
