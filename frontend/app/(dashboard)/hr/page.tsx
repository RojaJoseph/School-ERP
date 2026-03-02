'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { usePagination, useDebounce } from '@/hooks'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Briefcase, Plus, DollarSign, Users, Search,
  Pencil, FileText, Loader2, Trash2, CheckCircle, XCircle, Clock
} from 'lucide-react'

interface Employee {
  id: number; emp_code: string; first_name: string; last_name: string
  department?: string; designation?: string; employee_type: string
  salary: number; phone?: string; email?: string; is_active: boolean
}

interface LeaveRequest {
  id: number; employee_id: number; leave_type: string; from_date: string
  to_date: string; reason?: string; status: string
}

const DEPARTMENTS  = ['Mathematics','Science','English','Tamil','Social','Computer Science','Admin','HR','Accounts','Sports','Library','Transport']
const EMP_TYPES    = ['teaching','non_teaching','admin','support']

const EMPTY_EMP = {
  emp_code: '', first_name: '', last_name: '', gender: 'male',
  email: '', phone: '', department: 'Mathematics', designation: '',
  employee_type: 'teaching', salary: 0, join_date: '',
  bank_account: '', bank_name: '', pan_number: '',
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaves,    setLeaves]    = useState<LeaveRequest[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [tab,       setTab]       = useState<'employees' | 'leaves' | 'payroll'>('employees')
  const [search,    setSearch]    = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<Employee | null>(null)
  const [confirm,   setConfirm]   = useState<number | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_EMP })

  const debouncedSearch = useDebounce(search)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (deptFilter) params.department = deptFilter
      const res = await api.get('/hr/employees', { params })
      setEmployees(res.data.employees || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hr/leaves')
      setLeaves(res.data)
    } catch {
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'employees') fetchEmployees()
    else if (tab === 'leaves') fetchLeaves()
  }, [tab, page, deptFilter])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) {
        await api.put(`/hr/employees/${selected.id}`, form)
        toast.success('Employee updated!')
      } else {
        await api.post('/hr/employees', form)
        toast.success('Employee added!')
      }
      setShowModal(false)
      setSelected(null)
      setForm({ ...EMPTY_EMP })
      fetchEmployees()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveAction = async (leaveId: number, status: string) => {
    try {
      await api.patch(`/hr/leaves/${leaveId}/approve`, null, { params: { status } })
      toast.success(`Leave ${status}`)
      fetchLeaves()
    } catch {
      toast.error('Action failed')
    }
  }

  const filteredEmployees = debouncedSearch
    ? employees.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        e.emp_code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : employees

  const totalSalary = employees.reduce((a, e) => a + e.salary, 0)
  const teachingCount = employees.filter(e => e.employee_type === 'teaching').length

  return (
    <>
      <Navbar title="HR & Payroll" />
      <div className="p-6 space-y-5">

        <PageHeader title="HR & Payroll" subtitle="Manage staff and payroll">
          <button onClick={() => { setSelected(null); setForm({ ...EMPTY_EMP }); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Total Employees" value={total}        icon={Users}     color="bg-purple-500" />
          <StatsCard label="Teaching Staff"  value={teachingCount} icon={Briefcase} color="bg-blue-500"   />
          <StatsCard label="Monthly Payroll" value={formatCurrency(totalSalary)} icon={DollarSign} color="bg-green-500" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {(['employees','leaves','payroll'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'employees' ? '👥 Employees' : t === 'leaves' ? '📋 Leave Requests' : '💰 Payroll'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'employees' && (
          <>
            {/* Filters */}
            <div className="card !p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Search employees..." value={search} onChange={e => { setSearch(e.target.value); reset() }} />
              </div>
              <select className="input sm:w-44" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); reset() }}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-hidden">
              {loading ? <div className="py-16"><PageSpinner /></div> :
              filteredEmployees.length === 0 ? (
                <EmptyState icon={Users} title="No employees found" message="Add your first employee." action={{ label: 'Add Employee', onClick: () => { setShowModal(true) } }} />
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {['Emp Code','Name','Department','Designation','Type','Salary','Status','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredEmployees.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-blue-600 text-xs">{e.emp_code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
                                {e.first_name[0]}{e.last_name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{e.first_name} {e.last_name}</p>
                                <p className="text-xs text-gray-400">{e.email || e.phone || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{e.department || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{e.designation || '—'}</td>
                          <td className="px-4 py-3"><span className={e.employee_type === 'teaching' ? 'badge-blue' : 'badge-yellow'}>{e.employee_type}</span></td>
                          <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(e.salary)}</td>
                          <td className="px-4 py-3"><span className={e.is_active ? 'badge-green' : 'badge-red'}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => { setSelected(e); setForm({ emp_code: e.emp_code, first_name: e.first_name, last_name: e.last_name, gender: 'male', email: e.email||'', phone: e.phone||'', department: e.department||'Mathematics', designation: e.designation||'', employee_type: e.employee_type, salary: e.salary, join_date: '', bank_account: '', bank_name: '', pan_number: '' }); setShowModal(true) }}
                                className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"><Pencil className="w-3.5 h-3.5" /></button>
                              <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Payslip">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
                </>
              )}
            </div>
          </>
        )}

        {tab === 'leaves' && (
          <div className="card !p-0 overflow-hidden">
            {loading ? <div className="py-16"><PageSpinner /></div> :
            leaves.length === 0 ? (
              <EmptyState icon={FileText} title="No leave requests" message="Leave requests will appear here." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Employee','Type','From','To','Reason','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaves.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600">Emp #{l.employee_id}</td>
                      <td className="px-4 py-3 font-medium capitalize">{l.leave_type}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.from_date)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.to_date)}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={l.status === 'approved' ? 'badge-green' : l.status === 'rejected' ? 'badge-red' : 'badge-yellow'}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleLeaveAction(l.id, 'approved')}
                              className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLeaveAction(l.id, 'rejected')}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'payroll' && (
          <div className="card text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600">Payroll Generation</h3>
            <p className="text-sm text-gray-400 mt-1">Select a month and year to generate payroll for all employees</p>
            <div className="flex gap-3 justify-center mt-4">
              <select className="input w-36">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => (
                  <option key={i} value={i+1}>{m}</option>
                ))}
              </select>
              <select className="input w-28">
                <option>2024</option>
                <option>2025</option>
              </select>
              <button className="btn-primary"><DollarSign className="w-4 h-4" /> Generate Payroll</button>
            </div>
          </div>
        )}

      </div>

      {/* Employee Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelected(null) }}
        title={selected ? 'Edit Employee' : 'Add Employee'}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="emp-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selected ? 'Update' : 'Add Employee'}
            </button>
          </>
        }
      >
        <form id="emp-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employee Code *</label>
              <input className="input" value={form.emp_code} onChange={e => setF('emp_code', e.target.value)} required disabled={!!selected} />
            </div>
            <div>
              <label className="label">First Name *</label>
              <input className="input" value={form.first_name} onChange={e => setF('first_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" value={form.last_name} onChange={e => setF('last_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setF('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setF('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => setF('department', e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input" value={form.designation} onChange={e => setF('designation', e.target.value)} placeholder="e.g. Sr. Teacher" />
            </div>
            <div>
              <label className="label">Employee Type</label>
              <select className="input" value={form.employee_type} onChange={e => setF('employee_type', e.target.value)}>
                {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Salary *</label>
              <input type="number" className="input" value={form.salary} onChange={e => setF('salary', parseFloat(e.target.value))} required />
            </div>
            <div>
              <label className="label">Join Date</label>
              <input type="date" className="input" value={form.join_date} onChange={e => setF('join_date', e.target.value)} />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input className="input" value={form.pan_number} onChange={e => setF('pan_number', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {}}
        message="Are you sure you want to delete this employee record?"
      />
    </>
  )
}
