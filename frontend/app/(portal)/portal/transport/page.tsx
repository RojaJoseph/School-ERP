'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalPage, { PortalCard } from '@/components/portal/PortalPage'
import api from '@/lib/api'
import { Bus, Phone, MapPin, Clock, User } from 'lucide-react'

export default function TransportInfo() {
  const router = useRouter()
  const [info, setInfo]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = sessionStorage.getItem('portal_student')
    if (!s) { router.replace('/portal'); return }
    const student = JSON.parse(s)
    api.get(`/portal/student/${student.id}/transport`)
      .then(r => setInfo(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PortalPage title="Van Info" loading={loading}>
      {!info || !info.assigned ? (
        <div className="text-center py-16">
          <Bus className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No transport assigned to this student.</p>
          <p className="text-sm text-gray-400 mt-1">Contact school admin for transport registration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
            <Bus className="w-10 h-10 mb-3" />
            <h2 className="text-2xl font-bold">{info.route_name}</h2>
            <p className="text-blue-100">Route No: {info.route_no}</p>
          </div>
          <PortalCard>
            <h3 className="font-bold text-gray-800 mb-3">Schedule</h3>
            <div className="space-y-3">
              <Row icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Your Stop" value={info.stop_name || 'Not set'} />
              <Row icon={<Clock className="w-4 h-4 text-green-600" />} label="Pickup Time" value={info.pickup_time || 'Not set'} />
              <Row icon={<Clock className="w-4 h-4 text-red-500" />}   label="Drop Time"  value={info.drop_time  || 'Not set'} />
            </div>
          </PortalCard>
          <PortalCard>
            <h3 className="font-bold text-gray-800 mb-3">Driver Info</h3>
            <div className="space-y-3">
              <Row icon={<User className="w-4 h-4 text-purple-600" />}  label="Driver"        value={info.driver_name  || 'Not set'} />
              <Row icon={<Phone className="w-4 h-4 text-green-600" />}  label="Driver Phone"  value={info.driver_phone || 'Not set'} />
              <Row icon={<Bus className="w-4 h-4 text-orange-500" />}   label="Vehicle No"    value={info.vehicle_no   || 'Not set'} />
            </div>
          </PortalCard>
        </div>
      )}
    </PortalPage>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}
