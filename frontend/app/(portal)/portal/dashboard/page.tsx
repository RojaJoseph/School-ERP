'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, BookOpen, Calendar, FileText, BarChart2,
  CalendarDays, ClipboardList, Bus, Megaphone,
  MessageSquare, Image, FolderOpen, ClipboardCheck,
  LogOut, Bell, ChevronRight, GraduationCap,
  TrendingUp, Clock, CheckCircle,
} from 'lucide-react'
import api from '@/lib/api'

interface Student {
  id: number
  name: string
  class_name: string
  section: string
  admission_no: string
  photo?: string
  academic_year: string
  attendance_percentage?: number
}

const menuItems = [
  { key: 'child-info',      label: 'Child Info',       icon: User,          color: 'from-blue-400 to-blue-600',      href: 'child-info',      desc: 'Profile & details' },
  { key: 'homework',        label: 'Homework',          icon: BookOpen,      color: 'from-orange-400 to-orange-600',  href: 'homework',        desc: 'Daily homework' },
  { key: 'class-timetable', label: 'Class Timetable',   icon: Clock,         color: 'from-purple-400 to-purple-600',  href: 'class-timetable', desc: 'Weekly schedule' },
  { key: 'exam-timetable',  label: 'Exam Timetable',    icon: CalendarDays,  color: 'from-red-400 to-red-600',        href: 'exam-timetable',  desc: 'Upcoming exams' },
  { key: 'results',         label: 'Results',           icon: BarChart2,     color: 'from-green-400 to-green-600',    href: 'results',         desc: 'Marks & grades' },
  { key: 'calendar',        label: 'Calendar',          icon: Calendar,      color: 'from-teal-400 to-teal-600',      href: 'calendar',        desc: 'Events & holidays' },
  { key: 'leave-request',   label: 'Leave Request',     icon: ClipboardList, color: 'from-yellow-400 to-yellow-600',  href: 'leave-request',   desc: 'Apply for leave' },
  { key: 'van-info',        label: 'Van Info',          icon: Bus,           color: 'from-indigo-400 to-indigo-600',  href: 'van-info',        desc: 'Transport details' },
  { key: 'announcement',    label: 'Announcement',      icon: Megaphone,     color: 'from-pink-400 to-pink-600',      href: 'announcement',    desc: 'School notices' },
  { key: 'remarks',         label: 'Student Remarks',   icon: MessageSquare, color: 'from-cyan-400 to-cyan-600',      href: 'remarks',         desc: 'Teacher feedback' },
  { key: 'gallery',         label: 'Gallery',           icon: Image,         color: 'from-rose-400 to-rose-600',      href: 'gallery',         desc: 'School photos' },
  { key: 'projects',        label: 'Projects',          icon: FolderOpen,    color: 'from-amber-400 to-amber-600',    href: 'projects',        desc: 'Class projects' },
  { key: 'assignments',     label: 'Assignments',       icon: ClipboardCheck,color: 'from-violet-400 to-violet-600',  href: 'assignments',     desc: 'Submit assignments' },
]

export default function PortalDashboard() {
  const router  = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [stats,   setStats]   = useState({ attendance: 0, pending_hw: 0, upcoming_exams: 0 })

  useEffect(() => {
    const stored = localStorage.getItem('portal_student')
    if (!stored) { router.push('/portal'); return }
    const s = JSON.parse(stored)
    setStudent(s)
    // Fetch quick stats
    api.get(`/portal/student/${s.id}`).then(res => {
      setStudent(prev => prev ? { ...prev, attendance_percentage: res.data.attendance_percentage } : prev)
    }).catch(() => {})
    api.get(`/portal/attendance/${s.id}`).then(res => {
      setStats(prev => ({ ...prev, attendance: res.data.percentage }))
    }).catch(() => {})
    api.get(`/portal/exam-timetable/${s.id}`).then(res => {
      setStats(prev => ({ ...prev, upcoming_exams: res.data.length }))
    }).catch(() => {})
    api.get(`/portal/homework/${s.id}`).then(res => {
      setStats(prev => ({ ...prev, pending_hw: res.data.length }))
    }).catch(() => {})
  }, [])

  const logout = () => {
    localStorage.removeItem('portal_student')
    router.push('/portal')
  }

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm">School ERP</h1>
                <p className="text-indigo-200 text-xs">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button onClick={logout} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Student Card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {student.photo
                ? <img src={`http://localhost:8000/${student.photo}`} className="w-full h-full object-cover rounded-2xl" alt="" />
                : student.name.charAt(0).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-tight truncate">{student.name}</h2>
              <p className="text-indigo-200 text-sm">Class {student.class_name} - {student.section} | {student.academic_year}</p>
              <p className="text-indigo-300 text-xs mt-0.5">Adm No: {student.admission_no}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Attendance', value: `${stats.attendance}%`, icon: CheckCircle, color: 'text-green-300' },
              { label: 'Upcoming Exams', value: stats.upcoming_exams, icon: CalendarDays, color: 'text-yellow-300' },
              { label: 'Homework', value: stats.pending_hw, icon: BookOpen, color: 'text-pink-300' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                <p className="text-indigo-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Quick Access</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {menuItems.map(item => (
            <Link
              key={item.key}
              href={`/portal/${item.href}?id=${student.id}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl
                         shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5
                         border border-gray-100 active:scale-95"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color}
                              flex items-center justify-center shadow-sm
                              group-hover:scale-110 transition-transform duration-200`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {item.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
