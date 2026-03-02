'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { ClipboardList, Plus, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function LeaveRequestPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' })

  const fetchLeaves = () => {
    if (!id) return
    api.get(`/portal/leaves/${id}`).then(r => setLeaves(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchLeaves() }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.from_date || !form.to_date || !form.reason) { toast.error('Please fill all fields'); return }
    setSaving(true)
    try {
      await api.post(`/portal/leaves/${id}`, form)
      toast.success('Leave request submitted!')
      setShowForm(false)
      setForm({ from_date: '', to_date: '', reason: '' })
      fetchLeaves()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit')
    } finally { setSaving(false) }
  }

  const statusConfig: Record<string,{color:string,icon:any}> = {
    pending:  { color:'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { color:'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { color:'bg-red-100 text-red-600', icon: XCircle },
  }

  return (
    <PortalPage title="Leave Request">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mb-5">
        <Plus className="w-5 h-5" /> Apply for Leave
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm mb-5 space-y-4">
          <h3 className="font-bold text-gray-800">New Leave Request</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From Date</label>
              <input type="date" className="input" value={form.from_date}
                onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">To Date</label>
              <input type="date" className="input" value={form.to_date}
                onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input min-h-[80px]" placeholder="Reason for leave..."
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12"><ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No leave requests yet</p></div>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => {
            const cfg = statusConfig[l.status] || statusConfig.pending
            const Icon = cfg.icon
            return (
              <div key={l.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{l.from_date} → {l.to_date}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{l.reason}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" /> {l.status}
                  </span>
                </div>
                {l.remarks && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">💬 {l.remarks}</p>}
              </div>
            )
          })}
        </div>
      )}
    </PortalPage>
  )
}
