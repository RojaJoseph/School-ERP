'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { Image, X } from 'lucide-react'

export default function GalleryPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    api.get(`/portal/gallery/${id}`).then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  return (
    <PortalPage title="Gallery">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16"><Image className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No photos available</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <div key={item.id} onClick={() => setPreview(item)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-95">
                <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <img
                    src={`http://localhost:8000/${item.image_path}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as any).style.display='none' }}
                  />
                  <Image className="w-10 h-10 text-indigo-300 absolute" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                  {item.category && <p className="text-xs text-indigo-600">{item.category}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Preview Modal */}
          {preview && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
              <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full">
                <div className="aspect-square bg-gray-100">
                  <img src={`http://localhost:8000/${preview.image_path}`} alt={preview.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">{preview.title}</h3>
                  {preview.description && <p className="text-sm text-gray-500 mt-1">{preview.description}</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PortalPage>
  )
}
