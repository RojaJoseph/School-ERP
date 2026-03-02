'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { usePagination, useDebounce } from '@/hooks'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { formatDate } from '@/lib/utils'
import {
  BookOpen, Plus, Calendar, Clock, Search, Pencil, Trash2,
  ClipboardList, Loader2, BarChart2,
} from 'lucide-react'

interface Exam {
  id: number; name: string; exam_type: string; class_name: string
  section?: string; subject: string; exam_date: string
  start_time?: string; end_time?: string
  total_marks: number; passing_marks: number; academic_year: string
}

interface ExamResult {
  id: number; student_id: number; marks?: number; grade?: string; is_absent: boolean
}

const EXAM_TYPES = ['unit_test','midterm','final','quarterly','half_yearly','annual']
const CLASSES    = ['1','2','3','4','5','6','7','8','9','10','11','12']
const SUBJECTS   = ['Mathematics','Science','English','Tamil','Social Science','Physics','Chemistry','Biology','Computer Science','History','Geography']

const TYPE_BADGE: Record<string, string> = {
  unit_test:   'badge-blue',
  midterm:     'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium',
  final:       'badge-red',
  quarterly:   'bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium',
  half_yearly: 'bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium',
  annual:      'badge-green',
}

const EMPTY_FORM = {
  name: '', exam_type: 'unit_test', class_name: '10', section: 'A',
  subject: 'Mathematics', exam_date: '', start_time: '', end_time: '',
  total_marks: 100, passing_marks: 35, academic_year: '2024-25',
}

export default function ExamsPage() {
  const [exams,   setExams]   = useState<Exam[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [yearFilter,  setYearFilter]  = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [selected,   setSelected]  = useState<Exam | null>(null)
  const [results,    setResults]   = useState<ExamResult[]>([])
  const [confirm,    setConfirm]   = useState<number | null>(null)
  const [saving,     setSaving]    = useState(false)
  const [form,       setForm]      = useState({ ...EMPTY_FORM })

  const debouncedSearch = useDebounce(search)
  const { page, perPage, setPage, reset, totalPages } = usePagination(12)

  const fetchExams = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (classFilter) params.class_name    = classFilter
      if (yearFilter)  params.academic_year = yearFilter
      const res = await api.get('/exams', { params })
      const all: Exam[] = res.data
      const filtered = debouncedSearch
        ? all.filter(e =>
            e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
          )
        : all
      setTotal(filtered.length)
      setExams(filtered.slice((page - 1) * perPage, page * perPage))
    } catch {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExams() }, [debouncedSearch, classFilter, yearFilter, page])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) {
        await api.put(`/exams/${selected.id}`, form)
        toast.success('Exam updated!')
      } else {
        await api.post('/exams', form)
        toast.success('Exam created!')
      }
      setShowModal(false)
      setSelected(null)
      setForm({ ...EMPTY_FORM })
      fetchExams()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleViewResults = async (exam: Exam) => {
    setSelected(exam)
    try {
      const res = await api.get(`/exams/${exam.id}/results`)
      setResults(res.data)
    } catch {
      setResults([])
    }
    setShowResult(true)
  }

  const handleDelete = async () => {
    if (!confirm) return
    try {
      await api.delete(`/exams/${confirm}`)
      toast.success('Exam deleted')
      setConfirm(null)
      fetchExams()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date()).length
  const past     = exams.filter(e => new Date(e.exam_date) < new Date()).length

  return (
    <>
      <Navbar title="Exams & Assignments" />
      <div className="p-6 space-y-5">

        <PageHeader
          title="Exams"
          subtitle={`${total} exams found`}
          actions={[{ label: 'Create Exam', icon: Plus, onClick: () => { setSelected(null); setForm({ ...EMPTY_FORM }); setShowModal(true) } }]}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Total Exams"   value={total}    icon={BookOpen}     color="bg-blue-500"   />
          <StatsCard label="Upcoming"      value={upcoming} icon={Calendar}     color="bg-green-500"  />
          <StatsCard label="Completed"     value={past}     icon={ClipboardList} color="bg-purple-500" />
        </div>

        {/* Filters */}
        <div className="card !p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search exams or subjects..." value={search} onChange={e => { setSearch(e.target.value); reset() }} />
          </div>
          <select className="input sm:w-36" value={classFilter} onChange={e => { setClassFilter(e.target.value); reset() }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="input sm:w-36" value={yearFilter} onChange={e => { setYearFilter(e.target.value); reset() }}>
            <option value="">All Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-8"><PageSpinner /></div>
        ) : exams.length === 0 ? (
          <EmptyState icon={BookOpen} title="No exams found" message="Create your first exam schedule." action={{ label: 'Create Exam', onClick: () => { setSelected(null); setForm({ ...EMPTY_FORM }); setShowModal(true) } }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exams.map(e => {
              const isPast = new Date(e.exam_date) < new Date()
              return (
                <div key={e.id} className={`card hover:shadow-md transition-shadow border-l-4 ${isPast ? 'border-gray-300' : 'border-blue-500'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${isPast ? 'bg-gray-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                      <BookOpen className={`w-5 h-5 ${isPast ? 'text-gray-500' : 'text-blue-600'}`} />
                    </div>
                    <span className={TYPE_BADGE[e.exam_type] || 'badge-blue'}>{e.exam_type.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{e.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{e.subject} · Class {e.class_name} {e.section || ''}</p>
                  <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(e.exam_date)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Total: {e.total_marks} · Pass: {e.passing_marks}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleViewResults(e)}
                      className="btn-primary !py-1 !text-xs flex-1"
                    >
                      <BarChart2 className="w-3 h-3" /> Results
                    </button>
                    <button
                      onClick={() => { setSelected(e); setForm({ name: e.name, exam_type: e.exam_type, class_name: e.class_name, section: e.section || 'A', subject: e.subject, exam_date: e.exam_date, start_time: e.start_time || '', end_time: e.end_time || '', total_marks: e.total_marks, passing_marks: e.passing_marks, academic_year: e.academic_year }); setShowModal(true) }}
                      className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirm(e.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages(total) > 1 && (
          <div className="card !p-0">
            <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create/Edit Exam Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelected(null) }}
        title={selected ? 'Edit Exam' : 'Create New Exam'}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="exam-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selected ? 'Update Exam' : 'Create Exam'}
            </button>
          </>
        }
      >
        <form id="exam-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Exam Name *</label>
              <input className="input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Unit Test 1" required />
            </div>
            <div>
              <label className="label">Exam Type *</label>
              <select className="input" value={form.exam_type} onChange={e => setF('exam_type', e.target.value)}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="input" value={form.subject} onChange={e => setF('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class *</label>
              <select className="input" value={form.class_name} onChange={e => setF('class_name', e.target.value)}>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select className="input" value={form.section} onChange={e => setF('section', e.target.value)}>
                {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Exam Date *</label>
              <input type="date" className="input" value={form.exam_date} onChange={e => setF('exam_date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Academic Year *</label>
              <input className="input" value={form.academic_year} onChange={e => setF('academic_year', e.target.value)} required />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.start_time} onChange={e => setF('start_time', e.target.value)} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.end_time} onChange={e => setF('end_time', e.target.value)} />
            </div>
            <div>
              <label className="label">Total Marks *</label>
              <input type="number" className="input" value={form.total_marks} onChange={e => setF('total_marks', parseFloat(e.target.value))} required />
            </div>
            <div>
              <label className="label">Passing Marks *</label>
              <input type="number" className="input" value={form.passing_marks} onChange={e => setF('passing_marks', parseFloat(e.target.value))} required />
            </div>
          </div>
        </form>
      </Modal>

      {/* Results Modal */}
      {selected && (
        <Modal open={showResult} onClose={() => setShowResult(false)} title={`Results: ${selected.name}`} size="md">
          {results.length === 0 ? (
            <EmptyState icon={BarChart2} title="No results entered yet" message="Enter marks using the marks entry feature." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Student ID', 'Marks', 'Grade', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-blue-600">#{r.student_id}</td>
                    <td className="px-3 py-2 font-medium">{r.is_absent ? '—' : r.marks ?? '—'}</td>
                    <td className="px-3 py-2"><span className={r.grade === 'F' ? 'badge-red' : 'badge-green'}>{r.grade || '—'}</span></td>
                    <td className="px-3 py-2"><span className={r.is_absent ? 'badge-yellow' : 'badge-green'}>{r.is_absent ? 'Absent' : 'Present'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this exam and all associated results? This cannot be undone."
        confirmLabel="Delete"
      />
    </>
  )
}
