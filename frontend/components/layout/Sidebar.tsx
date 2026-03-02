'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserPlus, ClipboardCheck,
  BookOpen, DollarSign, Briefcase, Bus, Library,
  Package, BarChart3, MessageSquare, Settings,
  GraduationCap, LogOut, ChevronRight, X, Calendar,
  Shield, UserCheck,
} from 'lucide-react'

interface NavItem {
  label:  string
  href:   string
  icon:   React.ElementType
  module: string          // matches permission module name
  adminOnly?: boolean     // only super_admin / school_admin / sub_admin
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Students',      href: '/students',      icon: Users,           module: 'students' },
  { label: 'Admissions',    href: '/admissions',    icon: UserPlus,        module: 'admissions' },
  { label: 'Attendance',    href: '/attendance',    icon: ClipboardCheck,  module: 'attendance' },
  { label: 'Exams',         href: '/exams',         icon: BookOpen,        module: 'exams' },
  { label: 'Fees',          href: '/fees',          icon: DollarSign,      module: 'fees' },
  { label: 'HR & Payroll',  href: '/hr',            icon: Briefcase,       module: 'hr' },
  { label: 'Transport',     href: '/transport',     icon: Bus,             module: 'transport' },
  { label: 'Library',       href: '/library',       icon: Library,         module: 'library' },
  { label: 'Inventory',     href: '/inventory',     icon: Package,         module: 'inventory' },
  { label: 'Timetable',     href: '/timetable',     icon: Calendar,        module: 'timetable' },
  { label: 'Reports',       href: '/reports',       icon: BarChart3,       module: 'reports' },
  { label: 'Communication', href: '/communication', icon: MessageSquare,   module: 'communication' },
  { label: 'Permissions',   href: '/permissions',         icon: Shield,          module: 'settings', adminOnly: true },
  { label: 'Staff Attendance', href: '/teacher-attendance',           icon: UserCheck, module: 'attendance' },
  { label: 'My Attendance',    href: '/teacher-attendance/my-report',  icon: BarChart3, module: 'attendance' },
  { label: 'Settings',      href: '/settings',      icon: Settings,        module: 'settings' },
]

interface Props {
  open:    boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname             = usePathname()
  const { user, logout, hasPermission } = useAuthStore()
  const role                 = user?.role || ''
  const isAdmin              = ['super_admin', 'school_admin', 'sub_admin'].includes(role)

  const visible = navItems.filter(item => {
    if (item.adminOnly) return isAdmin
    return hasPermission(item.module)
  })

  const roleName = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-40 h-full w-64 bg-slate-800 flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">School ERP</h1>
              <p className="text-slate-400 text-xs">{roleName}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visible.map((item) => {
            const Icon   = item.icon
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn('sidebar-link', active && 'active')}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-slate-700 shrink-0">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300
                       hover:bg-red-600 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
