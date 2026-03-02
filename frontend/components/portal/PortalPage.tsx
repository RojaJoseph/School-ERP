'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, GraduationCap } from 'lucide-react'

interface Props {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export default function PortalPage({ title, children, action }: Props) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <GraduationCap className="w-5 h-5 text-purple-200" />
            <h1 className="font-bold text-base">{title}</h1>
          </div>
          {action}
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-5">
        {children}
      </div>
    </div>
  )
}
