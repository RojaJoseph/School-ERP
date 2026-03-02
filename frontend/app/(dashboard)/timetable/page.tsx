'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, ConfirmDialog } from '@/components/ui'
import { PageHeader, EmptyState } from '@/components/shared'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { Calendar, Plus, Trash2, Edit2, Loader2, Download, Clock } from 'lucide-react'

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12']

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:45', end: '10:30' },
  4: { start: '10:30', end: '11:15' },
  5: { start: '11:30', end: '12:15' },
  6: { start: '13:00', end: '13:45' },
  7: { start: '13:45', end: '14:30' },
  8: { start: '14:30', end: '15:15' },
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':  'bg-blue-100 text-blue-800 border-blue-200',
  'Science':      'bg-green-100 text-green-800 border-green-200',
  'English':      'bg-purple-100 text-purple-800 border-purple-200',
  'Tamil':        'bg-orange-100 text-orange-800 border-orange-200',
  'Social':       'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Computer':     'bg-pink-100 text-pink-800 border-pink-200',
  'Physical':     'bg-red-100 text-red-800 border-red-200',
  'Art':          'bg-indigo-100 text-indigo-800 border-indigo-200',
  'default':      'bg-gray-100 text-gray-700 border-gray-200',
}

function subjectColor(subject: string): string {
  return Object.entries(SUBJECT_COLORS).find(([k]) => subject.toLowerCase().includes(k.toLowerCase()))?.[1]
    || SUBJECT_COLORS.default
}

interface Entry {
  id: number
  day_of_week: string
  period_no: number
  subject: string
  teacher_name?: string
  start_time?: string
  end_time?: string
  room_no?: string
}

const EMPTY_FORM = {
  day_of_week: 'Monday', period_no: 1, subject: '',
  teacher_name: '', start_time: '', end_time: '', room_no: '',
}

export default function TimetablePage() {
  const [entries,     setEntries]    = useState<Entry[]>([])
  const [loading,     setLoading]    = useState(false)
  const [classFilter, setClassFilter]= useState('5')
  const [section,     setSection]    = useState('A')
  const [year,        setYear]       = useState('2024-25')
  const [showModal,   setShowModal]  = useState(false)
  const [editEntry,   setEditEntry]  = useState<Entry | null>(null)
  const [deleteId,    setDeleteId]   = useState<number | null>(null)
  const [saving,      setSaving]     = useState(false)
  const [deleting,    setDeleting]   = useState(false)
  const [form,        setForm]       = useState({ ...EMPTY_FORM })

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get('/timetable', {
        params: { class_name: classFilter, section, academic_year: year }
      })
      setEntries(res.data || [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [classFilter, section, year])

  // Build a day → period → entry lookup map
  const grid: Record<string, Record<number, Entry>> = {}
  DAYS.forEach(d => { grid[d] = {} })
  entries.forEach(e => { grid[e.day_of_week][e.period_no] = e })

  const openAdd = (day: string, period: number) => {
    const times = PERIOD_TIMES[period] || { start: '', end: '' }
    setForm({ day_of_week: day, period_no: period, subject: '',
      teacher_name: '', start_time: times.start, end_time: times.end, room_no: '' })
    setEditEntry(null)
    setShowModal(true)
  }

  const openEdit = (entry: Entry) => {
    setForm({
      day_of_week: entry.day_of_week, period_no: entry.period_no,
      subject: entry.subject, teacher_name: entry.teacher_name || '',
      start_time: entry.start_time || '', end_time: entry.end_time || '',
      room_no: entry.room_no || '',
    })
    setEditEntry(entry)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) { toast.error('Subject is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, class_name: classFilter, section, academic_year: year }
      if (editEntry) {
        await api.put(`/timetable/${editEntry.id}`, { subject: form.subject, teacher_name: form.teacher_name, start_time: form.start_time, end_time: form.end_time, room_no: form.room_no })
        toast.success('Entry updated')
      } else {
        await api.post('/timetable', payload)
        toast.success('Entry added')
      }
      setShowModal(false)
      fetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/timetable/${deleteId}`)
      toast.success('Entry removed')
      setDeleteId(null)
      fetch()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const exportCSV = () => {
    if (!entries.length) { toast.info('No timetable to export'); return }
    const rows = [
      ['Day','Period','Subject','Teacher','Start','End','Room'],
      ...entries.map(e => [e.day_of_week, e.period_no, e.subject, e.teacher_name || '', e.start_time || '', e.end_time || '', e.room_no || ''])
    ]
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `timetable_class${classFilter}${section}_${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Navbar title="Timetable" />
      <div className="p-4 lg:p-6 space-y-5">
        <PageHeader title="Academic Timetable" subtitle="Manage class schedules">
          <button onClick={exportCSV} className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
        </PageHeader>

        {/* Filters */}
        <div className="card !p-4 flex flex-wrap gap-3 items-center">
          <div>
            <label className="label">Class</label>
            <select className="input w-32" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input w-24" value={section} onChange={e => setSection(e.target.value)}>
              {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input w-32" value={year} onChange={e => setYear(e.target.value)} placeholder="2024-25" />
          </div>
          <div className="pt-5">
            <button onClick={fetch} className="btn-primary !py-2">Load</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {['Mathematics','Science','English','Tamil','Social','Computer','Physical','Art'].map(s => (
            <span key={s} className={`px-2 py-0.5 rounded-full border font-medium ${subjectColor(s)}`}>{s}</span>
          ))}
        </div>

        {/* Grid */}
        {loading ? <PageSpinner /> : (
          <div className="card !p-0 overflow-auto">
            <table className="w-full text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-slate-800 z-10 min-w-[90px]">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />Day / Period
                  </th>
                  {PERIODS.map(p => (
                    <th key={p} className="px-2 py-3 text-center font-semibold min-w-[120px]">
                      <div>Period {p}</div>
                      <div className="text-slate-400 font-normal text-xs">
                        {PERIOD_TIMES[p].start}–{PERIOD_TIMES[p].end}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day} className={di % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2 font-semibold text-slate-700 border-r border-gray-100 sticky left-0 bg-inherit text-xs">
                      {day}
                    </td>
                    {PERIODS.map(p => {
                      const entry = grid[day]?.[p]
                      return (
                        <td key={p} className="p-1 border border-gray-100 align-top min-w-[120px] h-16">
                          {entry ? (
                            <div className={`rounded-lg p-1.5 h-full border ${subjectColor(entry.subject)} flex flex-col justify-between group`}>
                              <div>
                                <p className="font-semibold text-xs leading-tight">{entry.subject}</p>
                                {entry.teacher_name && <p className="text-xs opacity-75 truncate">{entry.teacher_name}</p>}
                                {entry.room_no && <p className="text-xs opacity-60">Room {entry.room_no}</p>}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(entry)} className="p-0.5 hover:bg-white/50 rounded">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => setDeleteId(entry.id)} className="p-0.5 hover:bg-white/50 rounded text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAdd(day, p)}
                              className="w-full h-full flex items-center justify-center text-gray-300
                                         hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border-2
                                         border-dashed border-transparent hover:border-blue-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="card !p-4">
            <p className="text-sm text-gray-500">
              Class <strong>{classFilter}-{section}</strong> • {entries.length} periods scheduled
              {entries.length > 0 && ` • ${[...new Set(entries.map(e => e.subject))].length} subjects`}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editEntry ? 'Edit Timetable Entry' : `Add Entry — ${form.day_of_week}, Period ${form.period_no}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="tt-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editEntry ? 'Update' : 'Add Entry'}
            </button>
          </>
        }
      >
        <form id="tt-form" onSubmit={handleSave} className="space-y-3">
          {!editEntry && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Day</label>
                <select className="input" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Period</label>
                <select className="input" value={form.period_no} onChange={e => setForm(f => ({ ...f, period_no: +e.target.value }))}>
                  {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="label">Subject *</label>
            <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="label">Teacher</label>
            <input className="input" value={form.teacher_name} onChange={e => setForm(f => ({ ...f, teacher_name: e.target.value }))} placeholder="Teacher name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Start</label>
              <input type="time" className="input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">End</label>
              <input type="time" className="input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Room</label>
              <input className="input" value={form.room_no} onChange={e => setForm(f => ({ ...f, room_no: e.target.value }))} placeholder="101" />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Entry?"
        message="This period slot will be cleared from the timetable."
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  )
}
