'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarContext } from '@/context/SidebarContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, loadFromStorage } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token')
      if (!stored && !token) router.push('/login')
    }
  }, [token])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:ml-64 min-h-screen w-full">
        <SidebarContext.Provider value={() => setSidebarOpen(s => !s)}>
          {children}
        </SidebarContext.Provider>
      </main>
    </div>
  )
}
