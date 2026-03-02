'use client'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import { PageSpinner } from '@/components/ui'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { Check, X, Clock, Save, Loader2, RefreshCw, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CLASSES  = ['1','2','3','4','5','6','7','8','9','10','11','12']
const SECTIONS = ['A','B','C','D','E']

type Status = 'present' | 'absent' | 'leave' | 'late'

interface Student { id: number; first_name: string; last_name: string; roll_no?: string; admission_no: string }

const STATUS_CONFIG: Record<Status, { label: string; color: string; activeColor: string }> = {
  present: { label: 'P',  color: 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600',  activeColor: 'bg-green-500 text-white' },
  absent:  { label: 'A',  color: 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600',     activeColor: 'bg-red-500 text-white' },
  leave:   { label: 'L',  color: 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600', activeColor: 'bg-yellow-500 text-white' },
  late:    { label: 'Lt', color: 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-600', activeColor: 'bg-orange-500 text-white' },
}

export default function AttendancePage() {
  const [className, setClassName] = useState('10')
  const [section,   setSection]   = useState('A')
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0])
  const [students,  setStudents]  = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<number, Status>>({})
  const [loading,    setLoading]  = useState(false)
  const [saving,     setSaving]   = useState(false)
  const [search,     setSearch]   = useState('')

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/students', {
        params: { class_name: className, section, is_active: true, per_page: 100 },
      })
      const list: Student[] = res.data.students || []
      setStudents(list)

      // Try to fetch existing attendance for the date
      try {
        const attRes = await api.get('/attendance/class', {
          params: { class_name: className, section, date },
        })
        const existing: Record<number, Status> = {}
        ;(attRes.data.records || []).forEach((r: any) => {
          existing[r.student_id] = r.status
        })
        setAttendance(existing)
      } catch {
        // No existing attendance — start fresh, default all to present
        const fresh: Record<number, Status> = {}
        list.forEach(s => { fresh[s.id] = 'present' })
        setAttendance(fresh)
      }
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [className, section, date])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const setStatus = (id: number, status: Status) => setAttendance(a => ({ ...a, [id]: status }))

  const markAll = (status: Status) => {
    const all: Record<number, Status> = {}
    students.forEach(s => { all[s.id] = status })
    setAttendance(all)
  }

  const handleSave = async () => {
    if (students.length === 0) { toast.warning('No students to mark'); return }
    setSaving(true)
    try {
      const entries = students.map(s => ({
        student_id: s.id,
        status:     attendance[s.id] || 'absent',
        remarks:    null,
      }))
      await api.post('/attendance/bulk', {
        class_name: className,
        section,
        date,
        entries,
      })
      toast.success(`Attendance saved for ${students.length} students!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent:  Object.values(attendance).filter(s => s === 'absent').length,
    leave:   Object.values(attendance).filter(s => s === 'leave').length,
    late:    Object.values(attendance).filter(s => s === 'late').length,
  }

  const filteredStudents = search
    ? students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (s.roll_no || '').includes(search)
      )
    : students

  const attendancePercent = students.length > 0
    ? Math.round((counts.present / students.length) * 100)
    : 0

  return (
    <>
      <Navbar title="Attendance" />
      <div className="p-6 space-y-5">

        {/* Controls */}
        <div className="card !p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Class</label>
              <select className="input w-28" value={className} onChange={e => setClassName(e.target.value)}>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select className="input w-24" value={section} onChange={e => setSection(e.target.value)}>
                {SECTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button onClick={() => markAll('present')} className="btn-secondary !text-green-600 !border-green-200 hover:!bg-green-50">✓ All Present</button>
              <button onClick={() => markAll('absent')}  className="btn-secondary !text-red-600 !border-red-200 hover:!bg-red-50">✕ All Absent</button>
              <button onClick={fetchStudents} className="btn-secondary" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Present',  count: counts.present, color: 'bg-green-500',  pct: students.length ? Math.round(counts.present/students.length*100) : 0 },
            { label: 'Absent',   count: counts.absent,  color: 'bg-red-500',    pct: students.length ? Math.round(counts.absent/students.length*100)  : 0 },
            { label: 'Late',     count: counts.late,    color: 'bg-orange-500', pct: students.length ? Math.round(counts.late/students.length*100)    : 0 },
            { label: 'Leave',    count: counts.leave,   color: 'bg-yellow-500', pct: students.length ? Math.round(counts.leave/students.length*100)   : 0 },
          ].map(s => (
            <div key={s.label} className="card !p-4 text-center">
              <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-sm font-bold">{s.pct}%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="card !p-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium text-gray-700">Overall Attendance</span>
            <span className={`font-bold ${attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendancePercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${attendancePercent >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${attendancePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{students.length} total students</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          {loading ? (
            <div className="py-16"><PageSpinner /></div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No students found for Class {className} - {section}</p>
              <p className="text-gray-300 text-xs mt-1">Make sure students are enrolled in this class</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-20">Roll No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-60">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${
                      attendance[s.id] === 'absent' ? 'bg-red-50/30' :
                      attendance[s.id] === 'late'   ? 'bg-orange-50/30' :
                      attendance[s.id] === 'leave'  ? 'bg-yellow-50/30' : ''
                    }`}>
                      <td className="px-4 py-3 font-mono text-blue-600 text-xs">{s.roll_no || s.admission_no}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                            {s.first_name[0]}
                          </div>
                          <span className="font-medium text-gray-900">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {(Object.keys(STATUS_CONFIG) as Status[]).map(st => {
                            const cfg    = STATUS_CONFIG[st]
                            const active = attendance[s.id] === st
                            return (
                              <button
                                key={st}
                                onClick={() => setStatus(s.id, st)}
                                title={st}
                                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${active ? cfg.activeColor : cfg.color}`}
                              >
                                {cfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {filteredStudents.length} of {students.length} students · Date: <span className="font-medium">{formatDate(date)}</span>
                </p>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Attendance</>}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}
