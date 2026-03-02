'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  CheckCircle, Clock, XCircle, Users, RefreshCw,
  MapPin, Shield, Camera, Loader2, UserCheck, Edit
} from 'lucide-react'

interface StaffRecord {
  user_id: number
  name: string
  role: string
  email: string
  face_registered: boolean
  status: string
  check_in_time?: string
  distance_meters?: number
  face_confidence?: number
  selfie_path?: string
  marked_by?: string
}

export default function TeacherAttendanceDashboard() {
  const [data,        setData]       = useState<any>(null)
  const [loading,     setLoading]    = useState(true)
  const [filter,      setFilter]     = useState('all')
  const [overrideUser,setOverride]   = useState<StaffRecord | null>(null)
  const [overForm,    setOverForm]   = useState({ status: 'present', note: '', check_time: '' })
  const [saving,      setSaving]     = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/teacher-attendance/today')
      setData(res.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleOverride = async () => {
    if (!overrideUser) return
    setSaving(true)
    try {
      await api.post('/teacher-attendance/manual-mark', {
        user_id:    overrideUser.user_id,
        date:       new Date().toISOString().split('T')[0],
        status:     overForm.status,
        note:       overForm.note,
        check_time: overForm.check_time || undefined,
      })
      toast.success('Attendance updated!')
      setOverride(null)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update')
    } finally { setSaving(false) }
  }

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    present: { color: 'text-green-600', bg: 'bg-green-50',  icon: CheckCircle, label: 'Present' },
    late:    { color: 'text-yellow-600',bg: 'bg-yellow-50', icon: Clock,       label: 'Late' },
    absent:  { color: 'text-red-500',   bg: 'bg-red-50',    icon: XCircle,     label: 'Absent' },
  }

  const roleLabel = (r: string) => r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const filtered = data?.staff?.filter((s: StaffRecord) =>
    filter === 'all' ? true : s.status === filter
  ) || []

  return (
    <>
      <Navbar title="Teacher Attendance Dashboard" />
      <div className="p-4 lg:p-6 space-y-5">

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Staff',  value: data.summary.total,   color: 'from-blue-500 to-blue-600',   icon: Users },
              { label: 'Present',      value: data.summary.present, color: 'from-green-500 to-green-600', icon: CheckCircle },
              { label: 'Late',         value: data.summary.late,    color: 'from-yellow-400 to-yellow-500',icon: Clock },
              { label: 'Absent',       value: data.summary.absent,  color: 'from-red-500 to-red-600',     icon: XCircle },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
                <s.icon className="w-6 h-6 opacity-80 mb-2" />
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-white/80 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {['all','present','late','absent'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
                  ${filter === f ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Date: {data?.date || new Date().toLocaleDateString()}</span>
            <button onClick={fetchData} className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((staff: StaffRecord) => {
              const cfg = statusConfig[staff.status] || statusConfig.absent
              const Icon = cfg.icon
              return (
                <div key={staff.user_id} className="card !p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0
                    ${staff.status === 'present' ? 'bg-green-500' : staff.status === 'late' ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                    {staff.selfie_path
                      ? <img src={`http://localhost:8000/${staff.selfie_path}`} className="w-full h-full object-cover rounded-xl" alt="" onError={e => { (e.target as any).style.display='none' }} />
                      : staff.name.charAt(0)
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{staff.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{roleLabel(staff.role)}</span>
                      {!staff.face_registered && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Camera className="w-3 h-3" /> No Face
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      {staff.check_in_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{staff.check_in_time}</span>}
                      {staff.distance_meters != null && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{staff.distance_meters.toFixed(0)}m</span>}
                      {staff.face_confidence != null && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{(staff.face_confidence * 100).toFixed(0)}%</span>}
                      {staff.marked_by && <span className="text-gray-400">via {staff.marked_by}</span>}
                    </div>
                  </div>

                  {/* Status + Override */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <button
                      onClick={() => { setOverride(staff); setOverForm({ status: staff.status, note: '', check_time: staff.check_in_time || '' }) }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Manual override"
                    >
                      <Edit className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="card text-center py-12 text-gray-400">No records found</div>
            )}
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      {overrideUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-800 mb-1">Manual Override</h3>
            <p className="text-sm text-gray-500 mb-4">{overrideUser.name}</p>
            <div className="space-y-3">
              <div>
                <label className="label">Status</label>
                <select className="input" value={overForm.status} onChange={e => setOverForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <label className="label">Check-in Time</label>
                <input type="time" className="input" value={overForm.check_time}
                  onChange={e => setOverForm(f => ({ ...f, check_time: e.target.value }))} />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" placeholder="Reason..." value={overForm.note}
                  onChange={e => setOverForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOverride(null)} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={handleOverride} disabled={saving} className="flex-1 btn-primary justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
