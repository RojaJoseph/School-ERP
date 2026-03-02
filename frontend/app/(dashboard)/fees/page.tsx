'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { usePagination, useDebounce } from '@/hooks'
import api from '@/lib/api'
import { FeePayment, FeeStructure } from '@/types'
import { toast } from 'react-toastify'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign, TrendingUp, Clock, Loader2, Plus, Search,
  FileText, Check, AlertCircle,
} from 'lucide-react'

const PAYMENT_METHODS = ['cash','online','cheque','dd']
const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12']

const STATUS_BADGE: Record<string, string> = {
  paid:    'badge-green',
  pending: 'badge-yellow',
  overdue: 'badge-red',
  partial: 'badge-blue',
  waived:  'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium',
}

const EMPTY_PAYMENT = {
  student_id: '', fee_structure_id: '', amount: '', discount: 0, fine: 0,
  due_date: '', remarks: '',
}

const EMPTY_STRUCTURE = {
  name: '', class_name: '1', academic_year: '2024-25',
  amount: 0, due_date: '', description: '',
}

export default function FeesPage() {
  const [payments,    setPayments]   = useState<FeePayment[]>([])
  const [structures,  setStructures] = useState<FeeStructure[]>([])
  const [total,       setTotal]      = useState(0)
  const [loading,     setLoading]    = useState(false)
  const [tab,         setTab]        = useState<'payments' | 'structures'>('payments')
  const [statusFilter, setStatusFilter] = useState('')
  const [studentId,    setStudentId]    = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [payForm,  setPayForm]  = useState<any>({ ...EMPTY_PAYMENT })
  const [feeForm,  setFeeForm]  = useState<any>({ ...EMPTY_STRUCTURE })
  const [updateForm, setUpdateForm] = useState({ paid_amount: '', payment_method: 'cash', status: 'paid', remarks: '' })

  const debouncedStudent = useDebounce(studentId)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (statusFilter)       params.status     = statusFilter
      if (debouncedStudent)   params.student_id = parseInt(debouncedStudent)
      const res = await api.get('/fees/payments', { params })
      setPayments(res.data.payments || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStructures = async () => {
    setLoading(true)
    try {
      const res = await api.get('/fees/structures')
      setStructures(res.data)
    } catch {
      setStructures([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'payments') fetchPayments()
    else fetchStructures()
  }, [tab, page, statusFilter, debouncedStudent])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payForm.student_id) { toast.error('Enter student ID'); return }
    setSaving(true)
    try {
      await api.post('/fees/payments', {
        student_id:       parseInt(payForm.student_id),
        fee_structure_id: payForm.fee_structure_id ? parseInt(payForm.fee_structure_id) : null,
        amount:           parseFloat(payForm.amount),
        discount:         parseFloat(payForm.discount) || 0,
        fine:             parseFloat(payForm.fine) || 0,
        due_date:         payForm.due_date || null,
        remarks:          payForm.remarks,
      })
      toast.success('Payment record created!')
      setShowPayModal(false)
      setPayForm({ ...EMPTY_PAYMENT })
      fetchPayments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create payment')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return
    setSaving(true)
    try {
      await api.put(`/fees/payments/${selectedPayment.id}`, {
        paid_amount:    parseFloat(updateForm.paid_amount) || 0,
        payment_method: updateForm.payment_method,
        status:         updateForm.status,
        remarks:        updateForm.remarks,
      })
      toast.success('Payment updated!')
      setShowUpdateModal(false)
      setSelectedPayment(null)
      fetchPayments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/fees/structures', feeForm)
      toast.success('Fee structure created!')
      setShowFeeModal(false)
      setFeeForm({ ...EMPTY_STRUCTURE })
      fetchStructures()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create structure')
    } finally {
      setSaving(false)
    }
  }

  const collected = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.paid_amount, 0)
  const pendingCnt = payments.filter(p => p.status === 'pending').length
  const overdueCnt = payments.filter(p => p.status === 'overdue').length

  return (
    <>
      <Navbar title="Fees & Payments" />
      <div className="p-6 space-y-5">

        <PageHeader title="Fees & Payments" subtitle="Manage student fee collection">
          {tab === 'structures' && (
            <button onClick={() => { setFeeForm({ ...EMPTY_STRUCTURE }); setShowFeeModal(true) }} className="btn-secondary">
              <Plus className="w-4 h-4" /> Add Fee Structure
            </button>
          )}
          <button onClick={() => { setPayForm({ ...EMPTY_PAYMENT }); setShowPayModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Collected" value={formatCurrency(collected)} icon={DollarSign} color="bg-green-500" />
          <StatsCard label="Pending"   value={pendingCnt}                 icon={Clock}      color="bg-yellow-500" />
          <StatsCard label="Overdue"   value={overdueCnt}                 icon={AlertCircle} color="bg-red-500"  />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {(['payments','structures'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'payments' ? '💰 Payments' : '📋 Fee Structures'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'payments' && (
          <>
            <div className="card !p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9 w-44" type="number" placeholder="Student ID..." value={studentId} onChange={e => { setStudentId(e.target.value); reset() }} />
              </div>
              <select className="input sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); reset() }}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="waived">Waived</option>
              </select>
            </div>

            <div className="card !p-0 overflow-hidden">
              {loading ? <div className="py-16"><PageSpinner /></div> :
              payments.length === 0 ? (
                <EmptyState icon={DollarSign} title="No payment records" message="Add your first payment record." action={{ label: 'Add Payment', onClick: () => setShowPayModal(true) }} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {['Invoice','Student','Amount','Paid','Status','Method','Due Date','Paid At','Action'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments.map(p => (
                          <tr key={p.id} className={`hover:bg-gray-50 ${p.status === 'overdue' ? 'bg-red-50/20' : ''}`}>
                            <td className="px-4 py-3 font-mono text-blue-600 text-xs">{p.invoice_no}</td>
                            <td className="px-4 py-3 text-gray-700">#{p.student_id}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(p.paid_amount)}</td>
                            <td className="px-4 py-3"><span className={STATUS_BADGE[p.status] || 'badge-blue'}>{p.status}</span></td>
                            <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                            <td className="px-4 py-3">
                              {p.status !== 'paid' && p.status !== 'waived' && (
                                <button
                                  onClick={() => {
                                    setSelectedPayment(p)
                                    setUpdateForm({ paid_amount: p.amount.toString(), payment_method: 'cash', status: 'paid', remarks: '' })
                                    setShowUpdateModal(true)
                                  }}
                                  className="btn-primary !py-1 !text-xs"
                                >
                                  <Check className="w-3 h-3" /> Collect
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
                </>
              )}
            </div>
          </>
        )}

        {tab === 'structures' && (
          <div className="card !p-0 overflow-hidden">
            {loading ? <div className="py-16"><PageSpinner /></div> :
            structures.length === 0 ? (
              <EmptyState icon={FileText} title="No fee structures" message="Define fee structures for each class." action={{ label: 'Add Structure', onClick: () => setShowFeeModal(true) }} />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name','Class','Amount','Due Date','Year','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {structures.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3"><span className="badge-blue">Class {s.class_name}</span></td>
                      <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(s.amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.due_date)}</td>
                      <td className="px-4 py-3 text-gray-500">{s.academic_year}</td>
                      <td className="px-4 py-3"><span className="badge-green">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Create Fee Payment"
        size="md"
        footer={
          <>
            <button onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
            <button form="pay-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><DollarSign className="w-4 h-4" /> Create</>}
            </button>
          </>
        }
      >
        <form id="pay-form" onSubmit={handleAddPayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Student ID *</label>
              <input type="number" className="input" value={payForm.student_id} onChange={e => setPayForm((f: any) => ({ ...f, student_id: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Fee Structure</label>
              <select className="input" value={payForm.fee_structure_id} onChange={e => setPayForm((f: any) => ({ ...f, fee_structure_id: e.target.value }))}>
                <option value="">None (custom)</option>
                {structures.map(s => <option key={s.id} value={s.id}>{s.name} - {s.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount *</label>
              <input type="number" className="input" value={payForm.amount} onChange={e => setPayForm((f: any) => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={payForm.due_date} onChange={e => setPayForm((f: any) => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" className="input" value={payForm.discount} onChange={e => setPayForm((f: any) => ({ ...f, discount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fine (₹)</label>
              <input type="number" className="input" value={payForm.fine} onChange={e => setPayForm((f: any) => ({ ...f, fine: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Remarks</label>
              <input className="input" value={payForm.remarks} onChange={e => setPayForm((f: any) => ({ ...f, remarks: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Collect / Update Payment Modal */}
      <Modal
        open={showUpdateModal}
        onClose={() => { setShowUpdateModal(false); setSelectedPayment(null) }}
        title="Collect Payment"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowUpdateModal(false)} className="btn-secondary">Cancel</button>
            <button form="update-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Check className="w-4 h-4" /> Confirm Payment</>}
            </button>
          </>
        }
      >
        {selectedPayment && (
          <form id="update-form" onSubmit={handleUpdatePayment} className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="text-blue-700 font-medium">{selectedPayment.invoice_no}</p>
              <p className="text-blue-500">Total Due: {formatCurrency(selectedPayment.amount)}</p>
            </div>
            <div>
              <label className="label">Amount Received *</label>
              <input type="number" className="input" value={updateForm.paid_amount} onChange={e => setUpdateForm(f => ({ ...f, paid_amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select className="input" value={updateForm.payment_method} onChange={e => setUpdateForm(f => ({ ...f, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
                <option value="paid">Paid (Full)</option>
                <option value="partial">Partial</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <input className="input" value={updateForm.remarks} onChange={e => setUpdateForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
          </form>
        )}
      </Modal>

      {/* Add Fee Structure Modal */}
      <Modal
        open={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        title="Add Fee Structure"
        size="md"
        footer={
          <>
            <button onClick={() => setShowFeeModal(false)} className="btn-secondary">Cancel</button>
            <button form="fee-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Create Structure'}
            </button>
          </>
        }
      >
        <form id="fee-form" onSubmit={handleAddStructure} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Fee Name *</label>
              <input className="input" value={feeForm.name} onChange={e => setFeeForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Term 1 Fee" required />
            </div>
            <div>
              <label className="label">Class *</label>
              <select className="input" value={feeForm.class_name} onChange={e => setFeeForm((f: any) => ({ ...f, class_name: e.target.value }))}>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic Year *</label>
              <input className="input" value={feeForm.academic_year} onChange={e => setFeeForm((f: any) => ({ ...f, academic_year: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" value={feeForm.amount} onChange={e => setFeeForm((f: any) => ({ ...f, amount: parseFloat(e.target.value) }))} required />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" className="input" value={feeForm.due_date} onChange={e => setFeeForm((f: any) => ({ ...f, due_date: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={feeForm.description} onChange={e => setFeeForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
