'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { ClipboardList, Calendar } from 'lucide-react'

export default function ExamSchedulePage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalApi.get('/portal/exam-timetable').then(r => setExams(r.data)).finally(() => setLoading(false))
  }, [])

  const getDaysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'Past'
    if (diff === 0) return 'Today!'
    return `${diff} days`
  }

  return (
    <PortalPage title="Exam Timetable">
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
      exams.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming exams</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => {
            const daysLeft = getDaysLeft(exam.exam_date)
            const isToday = daysLeft === 'Today!'
            const isPast  = daysLeft === 'Past'
            return (
              <div key={exam.id} className={`bg-white rounded-2xl shadow-sm border p-4
                ${isToday ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{exam.name}</h3>
                    <p className="text-purple-600 text-xs font-medium mt-0.5">{exam.subject}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exam.exam_date}</span>
                      <span>{exam.start_time} - {exam.end_time}</span>
                      <span>Max: {exam.total_marks} marks</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0
                    ${isToday ? 'bg-red-100 text-red-600' :
                      isPast  ? 'bg-gray-100 text-gray-400' :
                                'bg-green-100 text-green-600'}`}>
                    {daysLeft}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PortalPage>
  )
}
