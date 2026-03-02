'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { CalendarDays, Clock } from 'lucide-react'

export default function ExamTimetablePage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/exam-timetable/${id}`)
      .then(r => setExams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const typeColor: Record<string,string> = {
    unit_test: 'bg-blue-100 text-blue-700',
    midterm: 'bg-yellow-100 text-yellow-700',
    final: 'bg-red-100 text-red-700',
    quarterly: 'bg-green-100 text-green-700',
    half_yearly: 'bg-purple-100 text-purple-700',
    annual: 'bg-orange-100 text-orange-700',
  }

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    if (diff === 0) return 'Today!'
    if (diff === 1) return 'Tomorrow!'
    return `In ${diff} days`
  }

  return (
    <PortalPage title="Exam Timetable">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No upcoming exams</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[exam.exam_type] || 'bg-gray-100 text-gray-600'}`}>
                      {exam.exam_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{exam.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium mt-0.5">{exam.subject}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs font-bold text-orange-500">{daysUntil(exam.exam_date)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total: {exam.total_marks} marks</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{exam.exam_date}</span>
                {exam.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.start_time} - {exam.end_time}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
