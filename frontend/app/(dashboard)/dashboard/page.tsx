'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { StatsCard } from '@/components/shared'
import { PageSpinner } from '@/components/ui'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Users, Briefcase, DollarSign, TrendingDown, GraduationCap,
  Bus, BookOpen, TrendingUp, Calendar, Bell,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const WEEK_COLORS = ['#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6']

const quickLinks = [
  { label: 'Add Student',     href: '/students/add',  icon: Users,       color: 'text-blue-600   bg-blue-50   hover:bg-blue-100' },
  { label: 'Mark Attendance', href: '/attendance',    icon: GraduationCap, color: 'text-green-600  bg-green-50  hover:bg-green-100' },
  { label: 'Collect Fee',     href: '/fees',          icon: DollarSign,  color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
  { label: 'View Reports',    href: '/reports',       icon: TrendingUp,  color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
  { label: 'Transport',       href: '/transport',     icon: Bus,         color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
  { label: 'Admissions',      href: '/admissions',    icon: BookOpen,    color: 'text-pink-600   bg-pink-50   hover:bg-pink-100' },
]

const attendanceData = [
  { day: 'Mon', present: 420, absent: 30 },
  { day: 'Tue', present: 400, absent: 50 },
  { day: 'Wed', present: 435, absent: 15 },
  { day: 'Thu', present: 410, absent: 40 },
  { day: 'Fri', present: 390, absent: 60 },
]

const feeData = [
  { month: 'Apr', collected: 120000, pending: 40000 },
  { month: 'May', collected: 150000, pending: 30000 },
  { month: 'Jun', collected: 140000, pending: 50000 },
  { month: 'Jul', collected: 180000, pending: 20000 },
  { month: 'Aug', collected: 160000, pending: 35000 },
  { month: 'Sep', collected: 200000, pending: 10000 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <>
      <Navbar title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
          <p className="text-blue-200 text-sm">{greeting()},</p>
          <h1 className="text-2xl font-bold mt-0.5">{user?.full_name || 'Welcome'} 👋</h1>
          <p className="text-blue-200 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>

        {/* Stats */}
        {loading ? <PageSpinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard label="Total Students"  value={summary?.total_students  ?? '—'} icon={Users}        color="bg-blue-500"   change="Enrolled students" />
            <StatsCard label="Total Employees" value={summary?.total_employees ?? '—'} icon={Briefcase}    color="bg-purple-500" change="Active staff" />
            <StatsCard label="Fee Collected"   value={summary ? formatCurrency(summary.fees_collected) : '—'} icon={DollarSign} color="bg-green-500" change="This academic year" trend="up" />
            <StatsCard label="Fee Pending"     value={summary ? formatCurrency(summary.fees_pending)   : '—'} icon={TrendingDown} color="bg-red-500"  change="Awaiting payment" trend="down" />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Weekly Attendance
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="present" fill="#3b82f6" radius={[4,4,0,0]} name="Present" />
                <Bar dataKey="absent"  fill="#fca5a5" radius={[4,4,0,0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" /> Monthly Fee Collection
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="collected" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Collected" />
                <Line type="monotone" dataKey="pending"   stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickLinks.map(q => (
              <Link key={q.label} href={q.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 cursor-pointer ${q.color}`}>
                <q.icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { text: 'New student admission application received', time: '2 min ago', color: 'bg-blue-100 text-blue-600' },
              { text: 'Attendance marked for Class 10-A',           time: '1 hr ago',  color: 'bg-green-100 text-green-600' },
              { text: 'Fee payment received from student #2024001', time: '2 hr ago',  color: 'bg-yellow-100 text-yellow-600' },
              { text: 'Leave request from Emp #EMP002 pending',      time: '3 hr ago',  color: 'bg-orange-100 text-orange-600' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.color}`}>
                  {i + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{a.text}</p>
                <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
