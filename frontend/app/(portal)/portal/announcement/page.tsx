'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { Megaphone } from 'lucide-react'

export default function AnnouncementPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/announcements/${id}`).then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const colors = ['from-blue-400 to-blue-600','from-purple-400 to-purple-600','from-pink-400 to-pink-600',
                  'from-orange-400 to-orange-600','from-teal-400 to-teal-600']

  return (
    <PortalPage title="Announcements">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16"><Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No announcements</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className={`bg-gradient-to-r ${colors[idx % colors.length]} p-3`}>
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-white/80" />
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
