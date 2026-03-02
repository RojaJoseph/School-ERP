'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  children: React.ReactNode
  backHref?: string
}

export default function PortalPage({ title, children, backHref }: Props) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{title}</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5">
        {children}
      </div>
    </div>
  )
}
