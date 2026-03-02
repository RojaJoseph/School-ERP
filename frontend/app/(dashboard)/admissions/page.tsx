'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { useDebounce, usePagination } from '@/hooks'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-toastify'
import {
  UserPlus, Search, Eye, Pencil, Trash2, Check, X,
  Clock, Users, CheckCircle, XCircle, Loader2,
} from 'lucide-react'

interface Admission {
  id: number
  application_no: string
  applicant_name: string
  date_of_birth: string
  gender: string
  applying_class: string
  academic_year: string
  previous_school?: string
  guardian_name: string
  guardian_phone: string
  guardian_email?: string
  status: string
  remarks?: string
  interview_date?: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  applied:     'badge-blue',
  shortlisted: 'badge-yellow',
  approved:    'badge-green',
  rejected:    'badge-red',
  enrolled:    'bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium',
}

const EMPTY_FORM = {
  application_no: '', applicant_name: '', date_of_birth: '',
  gender: 'male', applying_class: '1', academic_year: '2024-25',
  previous_school: '', previous_class: '', guardian_name: '',
  guardian_phone: '', guardian_email: '', address: '',
  interview_date: '',
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter,   setYearFilter]   = useState('')
  const [showModal,   setShowModal]  = useState(false)
  const [showView,    setShowView]   = useState(false)
  const [selected,    setSelected]   = useState<Admission | null>(null)
  const [confirm,     setConfirm]    = useState<number | null>(null)
  const [saving,      setSaving]     = useState(false)
  const [form,        setForm]       = useState({ ...EMPTY_FORM })

  const debouncedSearch = useDebounce(search, 400)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchAdmissions = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (yearFilter)   params.academic_year = yearFilter
      const res = await api.get('/admissions', { params })
      const all: Admission[] = res.data
      const filtered = debouncedSearch
        ? all.filter(a =>
            a.applicant_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            a.application_no.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            a.guardian_name.toLowerCase().includes(debouncedSearch.toLowerCase())
          )
        : all
      setTotal(filtered.length)
      setAdmissions(filtered.slice((page - 1) * perPage, page * perPage))
    } catch {
      toast.error('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAdmissions() }, [debouncedSearch, statusFilter, yearFilter, page])

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) {
        await api.put(`/admissions/${selected.id}`, form)
        toast.success('Admission updated!')
      } else {
        await api.post('/admissions', form)
        toast.success('Application submitted!')
      }
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      setSelected(null)
      fetchAdmissions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (a: Admission) => {
    setSelected(a)
    setForm({
      application_no: a.application_no,
      applicant_name: a.applicant_name,
      date_of_birth:  a.date_of_birth?.split('T')[0] || '',
      gender:         a.gender,
      applying_class: a.applying_class,
      academic_year:  a.academic_year,
      previous_school: a.previous_school || '',
      previous_class:  '',
      guardian_name:  a.guardian_name,
      guardian_phone: a.guardian_phone,
      guardian_email: a.guardian_email || '',
      address:        '',
      interview_date: a.interview_date?.split('T')[0] || '',
    })
    setShowModal(true)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admissions/${id}`, { status })
      toast.success(`Status updated to ${status}`)
      fetchAdmissions()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm) return
    try {
      await api.delete(`/admissions/${confirm}`)
      toast.success('Application deleted')
      setConfirm(null)
      fetchAdmissions()
    } catch {
      toast.error('Failed to delete')
    }
  }

  // Stats
  const statusCounts = { applied: 0, shortlisted: 0, approved: 0, rejected: 0 }
  // We'd need total counts from API; show as approximate from loaded data
  
  return (
    <>
      <Navbar title="Admissions" />
      <div className="p-6 space-y-5">

        <PageHeader
          title="Admissions"
          subtitle={`${total} applications found`}
          actions={[{
            label: 'New Application',
            icon: UserPlus,
            onClick: () => { setSelected(null); setForm({ ...EMPTY_FORM }); setShowModal(true) },
          }]}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Applied',     color: 'bg-blue-500',   icon: Users,       val: 'applied' },
            { label: 'Shortlisted', color: 'bg-yellow-500', icon: Clock,       val: 'shortlisted' },
            { label: 'Approved',    color: 'bg-green-500',  icon: CheckCircle, val: 'approved' },
            { label: 'Rejected',    color: 'bg-red-500',    icon: XCircle,     val: 'rejected' },
          ].map(s => (
            <button
              key={s.val}
              onClick={() => { setStatusFilter(statusFilter === s.val ? '' : s.val); reset() }}
              className={`card flex items-center gap-3 cursor-pointer hover:shadow-md transition-all text-left
                ${statusFilter === s.val ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card !p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, application no, guardian..."
              value={search}
              onChange={e => { setSearch(e.target.value); reset() }}
            />
          </div>
          <select className="input sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); reset() }}>
            <option value="">All Status</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="enrolled">Enrolled</option>
          </select>
          <select className="input sm:w-36" value={yearFilter} onChange={e => { setYearFilter(e.target.value); reset() }}>
            <option value="">All Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>

        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['App No', 'Applicant', 'Class', 'Guardian', 'Phone', 'Interview', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : admissions.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={UserPlus} title="No applications found" message="Add a new admission application to get started." />
                    </td>
                  </tr>
                ) : admissions.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{a.application_no}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{a.applicant_name}</p>
                        <p className="text-xs text-gray-400">{a.gender} · {formatDate(a.date_of_birth)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge-blue">Class {a.applying_class}</span></td>
                    <td className="px-4 py-3 text-gray-700">{a.guardian_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.guardian_phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.interview_date ? formatDate(a.interview_date) : '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={e => handleUpdateStatus(a.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer
                          ${STATUS_STYLES[a.status] || 'badge-blue'}`}
                      >
                        {['applied','shortlisted','approved','rejected','enrolled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(a); setShowView(true) }}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(a)}
                          className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirm(a.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelected(null) }}
        title={selected ? 'Edit Application' : 'New Admission Application'}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="admission-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selected ? 'Update' : 'Submit Application'}
            </button>
          </>
        }
      >
        <form id="admission-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Application No *</label>
              <input className="input" value={form.application_no} onChange={e => setF('application_no', e.target.value)} required disabled={!!selected} />
            </div>
            <div>
              <label className="label">Applicant Name *</label>
              <input className="input" value={form.applicant_name} onChange={e => setF('applicant_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input type="date" className="input" value={form.date_of_birth} onChange={e => setF('date_of_birth', e.target.value)} required />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select className="input" value={form.gender} onChange={e => setF('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Applying for Class *</label>
              <select className="input" value={form.applying_class} onChange={e => setF('applying_class', e.target.value)}>
                {['1','2','3','4','5','6','7','8','9','10','11','12'].map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Academic Year *</label>
              <input className="input" value={form.academic_year} onChange={e => setF('academic_year', e.target.value)} required />
            </div>
            <div>
              <label className="label">Previous School</label>
              <input className="input" value={form.previous_school} onChange={e => setF('previous_school', e.target.value)} />
            </div>
            <div>
              <label className="label">Interview Date</label>
              <input type="date" className="input" value={form.interview_date} onChange={e => setF('interview_date', e.target.value)} />
            </div>
          </div>
          <hr className="border-gray-100" />
          <h4 className="text-sm font-semibold text-gray-700">Guardian Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Guardian Name *</label>
              <input className="input" value={form.guardian_name} onChange={e => setF('guardian_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Guardian Phone *</label>
              <input className="input" value={form.guardian_phone} onChange={e => setF('guardian_phone', e.target.value)} required />
            </div>
            <div>
              <label className="label">Guardian Email</label>
              <input type="email" className="input" value={form.guardian_email} onChange={e => setF('guardian_email', e.target.value)} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => setF('address', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={showView} onClose={() => setShowView(false)} title="Application Details" size="md">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {selected.applicant_name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">{selected.applicant_name}</p>
                <span className={STATUS_STYLES[selected.status] || 'badge-blue'}>{selected.status}</span>
              </div>
            </div>
            {[
              ['Application No', selected.application_no],
              ['Applying for', `Class ${selected.applying_class}`],
              ['Academic Year', selected.academic_year],
              ['Date of Birth', formatDate(selected.date_of_birth)],
              ['Gender', selected.gender],
              ['Previous School', selected.previous_school || '—'],
              ['Guardian', selected.guardian_name],
              ['Guardian Phone', selected.guardian_phone],
              ['Guardian Email', selected.guardian_email || '—'],
              ['Applied on', formatDate(selected.created_at)],
              ['Interview Date', selected.interview_date ? formatDate(selected.interview_date) : '—'],
              ['Remarks', selected.remarks || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmLabel="Delete"
      />
    </>
  )
}
