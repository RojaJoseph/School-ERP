'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  Bus, Plus, MapPin, Phone, Users, Pencil, Trash2,
  UserPlus, Loader2, Check,
} from 'lucide-react'

interface BusRoute {
  id: number; route_name: string; route_no: string
  driver_name?: string; driver_phone?: string; vehicle_no?: string
  capacity: number; stops?: string; is_active: boolean
}

interface StudentTransport {
  id: number; student_id: number; route_id: number
  stop_name?: string; pickup_time?: string; drop_time?: string
}

const EMPTY_ROUTE = {
  route_name: '', route_no: '', driver_name: '', driver_phone: '',
  vehicle_no: '', capacity: 40, stops: '',
}

const EMPTY_ASSIGN = {
  student_id: '', route_id: '', stop_name: '', pickup_time: '', drop_time: '',
}

export default function TransportPage() {
  const [routes,    setRoutes]    = useState<BusRoute[]>([])
  const [loading,   setLoading]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAssign,setShowAssign]= useState(false)
  const [selected,  setSelected]  = useState<BusRoute | null>(null)
  const [confirm,   setConfirm]   = useState<number | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_ROUTE })
  const [assignForm, setAssignForm] = useState<any>({ ...EMPTY_ASSIGN })

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transport/routes')
      setRoutes(res.data)
    } catch {
      toast.error('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoutes() }, [])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) {
        await api.put(`/transport/routes/${selected.id}`, form)
        toast.success('Route updated!')
      } else {
        await api.post('/transport/routes', form)
        toast.success('Route created!')
      }
      setShowModal(false)
      setSelected(null)
      setForm({ ...EMPTY_ROUTE })
      fetchRoutes()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/transport/assign', {
        ...assignForm,
        student_id: parseInt(assignForm.student_id),
        route_id:   parseInt(assignForm.route_id),
      })
      toast.success('Transport assigned!')
      setShowAssign(false)
      setAssignForm({ ...EMPTY_ASSIGN })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  const activeRoutes   = routes.filter(r => r.is_active).length
  const totalCapacity  = routes.reduce((a, r) => a + r.capacity, 0)

  return (
    <>
      <Navbar title="Transport" />
      <div className="p-6 space-y-5">

        <PageHeader title="Transport Management" subtitle="Manage bus routes and student assignments">
          <button onClick={() => { setAssignForm({ ...EMPTY_ASSIGN }); setShowAssign(true) }} className="btn-secondary">
            <UserPlus className="w-4 h-4" /> Assign Student
          </button>
          <button onClick={() => { setSelected(null); setForm({ ...EMPTY_ROUTE }); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Route
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Total Routes"   value={routes.length}  icon={Bus}   color="bg-orange-500" />
          <StatsCard label="Active Routes"  value={activeRoutes}   icon={Check} color="bg-green-500"  />
          <StatsCard label="Total Capacity" value={totalCapacity}  icon={Users} color="bg-blue-500"   />
        </div>

        {/* Routes Grid */}
        {loading ? (
          <div className="py-16"><PageSpinner /></div>
        ) : routes.length === 0 ? (
          <EmptyState
            icon={Bus}
            title="No routes configured"
            message="Add your first bus route to get started."
            action={{ label: 'Add Route', onClick: () => { setSelected(null); setForm({ ...EMPTY_ROUTE }); setShowModal(true) } }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {routes.map(r => {
              let stops: string[] = []
              try { stops = r.stops ? JSON.parse(r.stops) : [] } catch { stops = r.stops ? r.stops.split(',') : [] }
              return (
                <div key={r.id} className={`card hover:shadow-md transition-shadow ${!r.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="badge-blue text-xs">{r.route_no}</span>
                      <span className={r.is_active ? 'badge-green' : 'badge-red'}>{r.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{r.route_name}</h3>
                  {r.vehicle_no && <p className="text-xs font-mono text-gray-400 mb-3">{r.vehicle_no}</p>}

                  <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                    {r.driver_name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{r.driver_name}</span>
                      </div>
                    )}
                    {r.driver_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{r.driver_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>Capacity: {r.capacity}</span>
                    </div>
                  </div>

                  {stops.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Stops ({stops.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {stops.slice(0,3).map((s, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                        {stops.length > 3 && <span className="text-xs text-gray-400">+{stops.length-3} more</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setSelected(r); setForm({ route_name: r.route_name, route_no: r.route_no, driver_name: r.driver_name||'', driver_phone: r.driver_phone||'', vehicle_no: r.vehicle_no||'', capacity: r.capacity, stops: r.stops||'' }); setShowModal(true) }}
                      className="flex-1 btn-secondary !py-1.5 !text-xs"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => { setAssignForm({ ...EMPTY_ASSIGN, route_id: r.id.toString() }); setShowAssign(true) }}
                      className="flex-1 btn-primary !py-1.5 !text-xs"
                    >
                      <UserPlus className="w-3 h-3" /> Assign
                    </button>
                    <button onClick={() => setConfirm(r.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Route Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelected(null) }}
        title={selected ? 'Edit Bus Route' : 'Add New Route'}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="route-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selected ? 'Update Route' : 'Add Route'}
            </button>
          </>
        }
      >
        <form id="route-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Route No *</label>
              <input className="input" value={form.route_no} onChange={e => setF('route_no', e.target.value)} placeholder="R01" required />
            </div>
            <div>
              <label className="label">Route Name *</label>
              <input className="input" value={form.route_name} onChange={e => setF('route_name', e.target.value)} placeholder="Anna Nagar Route" required />
            </div>
            <div>
              <label className="label">Driver Name</label>
              <input className="input" value={form.driver_name} onChange={e => setF('driver_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Driver Phone</label>
              <input className="input" value={form.driver_phone} onChange={e => setF('driver_phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle Number</label>
              <input className="input" value={form.vehicle_no} onChange={e => setF('vehicle_no', e.target.value)} placeholder="TN-01-AB-1234" />
            </div>
            <div>
              <label className="label">Capacity *</label>
              <input type="number" className="input" value={form.capacity} onChange={e => setF('capacity', parseInt(e.target.value))} required />
            </div>
            <div className="col-span-2">
              <label className="label">Stops (comma-separated or JSON)</label>
              <textarea className="input" rows={2} value={form.stops} onChange={e => setF('stops', e.target.value)} placeholder="Stop 1, Stop 2, Stop 3" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Assign Student Modal */}
      <Modal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Student to Route"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowAssign(false)} className="btn-secondary">Cancel</button>
            <button form="assign-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : 'Assign'}
            </button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="label">Student ID *</label>
            <input type="number" className="input" value={assignForm.student_id} onChange={e => setAssignForm((f: any) => ({ ...f, student_id: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Route *</label>
            <select className="input" value={assignForm.route_id} onChange={e => setAssignForm((f: any) => ({ ...f, route_id: e.target.value }))} required>
              <option value="">Select Route</option>
              {routes.filter(r => r.is_active).map(r => (
                <option key={r.id} value={r.id}>{r.route_no} - {r.route_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Stop Name</label>
            <input className="input" value={assignForm.stop_name} onChange={e => setAssignForm((f: any) => ({ ...f, stop_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pickup Time</label>
              <input type="time" className="input" value={assignForm.pickup_time} onChange={e => setAssignForm((f: any) => ({ ...f, pickup_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Drop Time</label>
              <input type="time" className="input" value={assignForm.drop_time} onChange={e => setAssignForm((f: any) => ({ ...f, drop_time: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            // No delete endpoint in router, deactivate via update
            toast.info('Route deactivation not implemented in API yet')
            setConfirm(null)
          } catch {}
        }}
        message="Are you sure you want to deactivate this bus route?"
        variant="warning"
        confirmLabel="Deactivate"
      />
    </>
  )
}
