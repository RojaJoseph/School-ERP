'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { Bell } from 'lucide-react'

const priorityStyle: Record<string,string> = {
  urgent: 'border-l-4 border-red-500 bg-red-50',
  high:   'border-l-4 border-orange-400 bg-orange-50',
  normal: 'border-l-4 border-blue-400 bg-white',
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalApi.get('/portal/announcements').then(r => setItems(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <PortalPage title="Announcements">
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
      items.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`rounded-2xl shadow-sm p-4 ${priorityStyle[item.priority] || priorityStyle.normal} border border-gray-100`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                {item.priority !== 'normal' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 capitalize
                    ${item.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {item.priority}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(item.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
