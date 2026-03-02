'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

const statusColors: Record<string,string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function LeavePage() {
  const [leaves,  setLeaves]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm,setShowForm]= useState(false)
  const [form,    setForm]    = useState({ from_date:'', to_date:'', reason:'' })
  const [saving,  setSaving]  = useState(false)

  const fetchLeaves = () => {
    portalApi.get('/portal/leave').then(r => setLeaves(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchLeaves() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const student = JSON.parse(localStorage.getItem('portal_student') || '{}')
      await portalApi.post('/portal/leave', { ...form, student_id: student.id })
      toast.success('Leave request submitted!')
      setShowForm(false)
      setForm({ from_date:'', to_date:'', reason:'' })
      fetchLeaves()
    } catch { toast.error('Failed to submit leave') }
    finally { setSaving(false) }
  }

  return (
    <PortalPage title="Leave Request"
      action={
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-white transition-colors">
          <Plus className="w-3.5 h-3.5" /> Apply
        </button>
      }
    >
      {/* Apply Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">New Leave Request</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From Date *</label>
                <input type="date" required className="input text-sm" value={form.from_date}
                  onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To Date *</label>
                <input type="date" required className="input text-sm" value={form.to_date}
                  onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reason *</label>
              <textarea required rows={3} className="input text-sm resize-none" value={form.reason}
                placeholder="Reason for leave..."
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
      leaves.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No leave requests</p>
          <button onClick={() => setShowForm(true)} className="mt-3 btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(lv => (
            <div key={lv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{lv.from_date} → {lv.to_date}</p>
                  <p className="text-xs text-gray-500 mt-1">{lv.reason}</p>
                  {lv.review_note && <p className="text-xs text-blue-600 mt-1 italic">Note: {lv.review_note}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ml-3 ${statusColors[lv.status]}`}>
                  {lv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
