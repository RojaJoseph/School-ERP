'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import {
  CheckCircle, Clock, XCircle, ChevronLeft,
  ChevronRight, Calendar, TrendingUp, Award,
  BarChart3, MapPin, Shield,
} from 'lucide-react'

interface DayRecord {
  date:          string
  status:        string
  check_in_time: string | null
}

interface MonthData {
  present: number
  late:    number
  absent:  number
  days:    DayRecord[]
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  present: { bg: 'bg-green-500',  text: 'text-green-700',  border: 'border-green-300', icon: CheckCircle, label: 'Present' },
  late:    { bg: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-300',icon: Clock,       label: 'Late'    },
  absent:  { bg: 'bg-red-400',    text: 'text-red-700',    border: 'border-red-300',   icon: XCircle,     label: 'Absent'  },
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function MyReportPage() {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const now       = new Date()

  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [data,    setData]    = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allTime, setAllTime] = useState<{ present: number; late: number; absent: number } | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchMonthData()
      fetchAllTimeStats()
    }
  }, [year, month, user])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/teacher-attendance/monthly/${user?.id}?year=${year}&month=${month}`)
      setData(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  const fetchAllTimeStats = async () => {
    // Fetch last 12 months to get all-time summary
    try {
      let totalPresent = 0, totalLate = 0, totalAbsent = 0
      const promises = []
      for (let m = 1; m <= 12; m++) {
        promises.push(api.get(`/teacher-attendance/monthly/${user?.id}?year=${year}&month=${m}`))
      }
      const results = await Promise.allSettled(promises)
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          totalPresent += r.value.data.present
          totalLate    += r.value.data.late
          totalAbsent  += r.value.data.absent
        }
      })
      setAllTime({ present: totalPresent, late: totalLate, absent: totalAbsent })
    } catch {}
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    const n = new Date()
    if (year === n.getFullYear() && month === n.getMonth() + 1) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const isToday = (dateStr: string) => dateStr === now.toISOString().split('T')[0]

  // Build calendar grid
  const buildCalendar = () => {
    if (!data) return []
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const cells: (DayRecord | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push(data.days.find(r => r.date === dateStr) || { date: dateStr, status: 'absent', check_in_time: null })
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const total       = data ? data.present + data.late + data.absent : 0
  const workingDays = data ? data.present + data.late + data.absent : 0
  const attendancePct = workingDays > 0 ? Math.round(((data!.present + data!.late) / workingDays) * 100) : 0
  const calendar    = buildCalendar()

  return (
    <>
      <Navbar title="My Attendance Report" />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Profile card */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{user?.full_name}</p>
              <p className="text-blue-200 text-sm capitalize">{user?.role?.replace(/_/g,' ')}</p>
              <p className="text-blue-300 text-xs mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Year summary quick stats */}
          {allTime && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: `${year} Present`, value: allTime.present, color: 'bg-green-400/30' },
                { label: `${year} Late`,    value: allTime.late,    color: 'bg-yellow-400/30' },
                { label: `${year} Absent`,  value: allTime.absent,  color: 'bg-red-400/30'   },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-xl p-2 text-center`}>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-blue-100 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Month Navigator */}
        <div className="card !p-4">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">{MONTH_NAMES[month - 1]}</p>
              <p className="text-gray-400 text-sm">{year}</p>
            </div>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Month stats */}
          {!loading && data && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: 'Present', value: data.present, cfg: STATUS_CONFIG.present },
                { label: 'Late',    value: data.late,    cfg: STATUS_CONFIG.late    },
                { label: 'Absent',  value: data.absent,  cfg: STATUS_CONFIG.absent  },
                { label: 'Rate',    value: `${attendancePct}%`, cfg: { bg:'bg-blue-500', text:'text-blue-700', border:'border-blue-300', icon:TrendingUp, label:'Rate' } },
              ].map(s => (
                <div key={s.label} className={`border ${s.cfg.border} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.cfg.text}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance percentage bar */}
        {!loading && data && (
          <div className="card !p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Attendance Rate</p>
              <p className={`text-sm font-bold ${attendancePct >= 90 ? 'text-green-600' : attendancePct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                {attendancePct}%
              </p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${attendancePct >= 90 ? 'bg-green-500' : attendancePct >= 75 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span className={attendancePct >= 75 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {attendancePct >= 90 ? '🏆 Excellent' : attendancePct >= 75 ? '✅ Good' : '⚠️ Below minimum'}
              </span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="card !p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Attendance Calendar
          </h3>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((cell, idx) => {
                if (!cell) return <div key={idx} />
                const dayNum = parseInt(cell.date.split('-')[2])
                const cfg    = STATUS_CONFIG[cell.status]
                const today  = isToday(cell.date)
                const future = new Date(cell.date) > now

                return (
                  <div key={idx} className="flex flex-col items-center py-1">
                    <div className={`
                      w-9 h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold
                      transition-all cursor-default relative
                      ${future
                        ? 'bg-gray-50 text-gray-300'
                        : today
                        ? `${cfg.bg} text-white ring-2 ring-offset-1 ring-blue-400`
                        : cell.status === 'present' ? 'bg-green-100 text-green-700'
                        : cell.status === 'late'    ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-50 text-red-400'
                      }
                    `}>
                      <span>{dayNum}</span>
                      {!future && (
                        <div className={`w-1.5 h-1.5 rounded-full mt-0.5
                          ${cell.status === 'present' ? 'bg-green-500'
                          : cell.status === 'late'    ? 'bg-yellow-500'
                          : 'bg-red-400'}`}
                        />
                      )}
                    </div>
                    {!future && cell.check_in_time && (
                      <p className="text-gray-400 text-[9px] mt-0.5 leading-tight">{cell.check_in_time}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block" />Late</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-300 inline-block" />Absent</span>
          </div>
        </div>

        {/* Day-by-day list — only marked days */}
        <div className="card !p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Daily Details
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {data?.days
                .filter(d => new Date(d.date) <= now && d.check_in_time)
                .reverse()
                .map(d => {
                  const cfg  = STATUS_CONFIG[d.status]
                  const Icon = cfg.icon
                  const dateObj = new Date(d.date)
                  return (
                    <div key={d.date} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} bg-white`}>
                      <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {dateObj.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
                        </p>
                        <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                      </div>
                      {d.check_in_time && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-700">{d.check_in_time}</p>
                          <p className="text-xs text-gray-400">Check-in</p>
                        </div>
                      )}
                    </div>
                  )
                })}

              {data?.days.filter(d => new Date(d.date) <= now && d.check_in_time).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No attendance recorded this month</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mark attendance button */}
        <button
          onClick={() => router.push('/teacher-attendance')}
          className="w-full btn-primary justify-center py-3 text-base rounded-2xl"
        >
          <CheckCircle className="w-5 h-5" /> Mark Today's Attendance
        </button>

      </div>
    </>
  )
}
