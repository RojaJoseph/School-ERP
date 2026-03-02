'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { Bus, MapPin, User, Phone, Clock, Hash } from 'lucide-react'

export default function VanInfoPage() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalApi.get('/portal/van').then(r => setInfo(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <PortalPage title="Van Info">
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
      !info?.assigned ? (
        <div className="text-center py-16">
          <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No transport assigned</p>
          <p className="text-gray-400 text-sm mt-1">Contact school admin for transport details</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bus card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bus className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-purple-200 text-xs">Route</p>
                <h3 className="font-bold text-lg">{info.route_name}</h3>
                <p className="text-purple-200 text-sm">Route No: {info.route_no}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs mb-1">Vehicle Number</p>
              <p className="text-xl font-bold tracking-widest">{info.vehicle_no || 'N/A'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { icon: MapPin, label: 'Your Stop',    value: info.stop_name || 'N/A' },
              { icon: Clock,  label: 'Pickup Time',  value: info.pickup_time || 'N/A' },
              { icon: Clock,  label: 'Drop Time',    value: info.drop_time || 'N/A' },
              { icon: User,   label: 'Driver Name',  value: info.driver_name || 'N/A' },
              { icon: Phone,  label: 'Driver Phone', value: info.driver_phone || 'N/A' },
            ].map((row, i, arr) => {
              const Icon = row.icon
              return (
                <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i < arr.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {info.driver_phone && info.driver_phone !== 'N/A' && (
            <a href={`tel:${info.driver_phone}`}
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600
                         text-white py-3 rounded-2xl font-semibold transition-colors">
              <Phone className="w-4 h-4" /> Call Driver
            </a>
          )}
        </div>
      )}
    </PortalPage>
  )
}
