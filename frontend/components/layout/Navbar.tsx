'use client'
import { useState } from 'react'
import { Bell, Search, Menu, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useSidebarToggle } from '@/context/SidebarContext'

interface Props {
  title: string
}

export default function Navbar({ title }: Props) {
  const { user, logout }  = useAuthStore()
  const router            = useRouter()
  const toggleSidebar     = useSidebarToggle()
  const [showMenu, setShowMenu] = useState(false)

  const roleLabel = (role: string) =>
    (role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base lg:text-lg font-semibold text-gray-800 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-blue-500 w-40 lg:w-56 bg-gray-50"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={() => router.push('/communication')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg pl-1 pr-2 lg:pr-3 py-1 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.full_name}</p>
              <p className="text-xs text-gray-400">{roleLabel(user?.role || '')}</p>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200
                              rounded-xl shadow-lg z-50 py-1.5 text-sm animate-in">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{roleLabel(user?.role || '')}</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); router.push('/settings') }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-600
                             flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { setShowMenu(false); logout() }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600
                               flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
