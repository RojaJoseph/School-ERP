'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { Bus, User, Phone, MapPin, Clock, Hash } from 'lucide-react'

export default function VanInfoPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/van/${id}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const Row = ({ icon: Icon, label, value }: any) => value ? (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  ) : null

  return (
    <PortalPage title="Van Info">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : !data?.assigned ? (
        <div className="text-center py-16">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No transport assigned</p>
          <p className="text-gray-400 text-sm mt-1">Contact the school office to arrange transport</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white text-center">
            <Bus className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <h2 className="text-xl font-bold">{data.route_name}</h2>
            <p className="text-indigo-200 text-sm">Route No: {data.route_no}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">Your Stop</h3>
            <Row icon={MapPin} label="Stop Name" value={data.stop_name} />
            <Row icon={Clock} label="Pickup Time" value={data.pickup_time} />
            <Row icon={Clock} label="Drop Time" value={data.drop_time} />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">Driver Details</h3>
            <Row icon={User} label="Driver Name" value={data.driver_name} />
            <Row icon={Phone} label="Driver Phone" value={data.driver_phone} />
            <Row icon={Hash} label="Vehicle No" value={data.vehicle_no} />
          </div>
        </div>
      )}
    </PortalPage>
  )
}
