'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, BookOpen, Calendar, ClipboardList, Award,
  CalendarDays, FileText, Bus, Bell, MessageSquare,
  Image, FolderOpen, BookMarked, LogOut, GraduationCap,
  ChevronRight,
} from 'lucide-react'

interface Student {
  id: number
  full_name: string
  class_name: string
  section: string
  admission_no: string
  roll_no: string
  photo?: string
  academic_year: string
}

const menuItems = [
  { label: 'Child Info',       href: '/portal/info',        icon: User,          color: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50',   text: 'text-blue-600',   desc: 'Personal details' },
  { label: 'Homework',         href: '/portal/homework',    icon: BookOpen,      color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600', desc: 'Daily homework' },
  { label: 'Class Timetable',  href: '/portal/timetable',   icon: Calendar,      color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600', desc: 'Weekly schedule' },
  { label: 'Exam Timetable',   href: '/portal/exam-schedule',icon: ClipboardList,color: 'from-red-500 to-red-600',       bg: 'bg-red-50',    text: 'text-red-600',    desc: 'Upcoming exams' },
  { label: 'Results',          href: '/portal/results',     icon: Award,         color: 'from-green-500 to-green-600',   bg: 'bg-green-50',  text: 'text-green-600',  desc: 'Marks & grades' },
  { label: 'Calendar',         href: '/portal/calendar',    icon: CalendarDays,  color: 'from-teal-500 to-teal-600',     bg: 'bg-teal-50',   text: 'text-teal-600',   desc: 'Events & holidays' },
  { label: 'Leave Request',    href: '/portal/leave',       icon: FileText,      color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50', text: 'text-yellow-600', desc: 'Apply for leave' },
  { label: 'Van Info',         href: '/portal/van',         icon: Bus,           color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600', desc: 'Transport details' },
  { label: 'Announcements',    href: '/portal/announcements',icon: Bell,         color: 'from-pink-500 to-pink-600',     bg: 'bg-pink-50',   text: 'text-pink-600',   desc: 'School notices' },
  { label: 'Student Remarks',  href: '/portal/remarks',     icon: MessageSquare, color: 'from-cyan-500 to-cyan-600',     bg: 'bg-cyan-50',   text: 'text-cyan-600',   desc: 'Teacher feedback' },
  { label: 'Gallery',          href: '/portal/gallery',     icon: Image,         color: 'from-rose-500 to-rose-600',     bg: 'bg-rose-50',   text: 'text-rose-600',   desc: 'School photos' },
  { label: 'Projects',         href: '/portal/projects',    icon: FolderOpen,    color: 'from-amber-500 to-amber-600',   bg: 'bg-amber-50',  text: 'text-amber-600',  desc: 'Class projects' },
  { label: 'Assignments',      href: '/portal/assignments', icon: BookMarked,    color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600', desc: 'Submit work' },
]

export default function PortalHomePage() {
  const router  = useRouter()
  const [student, setStudent] = useState<Student | null>(null)

  useEffect(() => {
    const data = localStorage.getItem('portal_student')
    if (!data) { router.push('/portal'); return }
    setStudent(JSON.parse(data))
  }, [])

  const logout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_student')
    router.push('/portal')
  }

  if (!student) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-200">Student Portal</p>
                <p className="font-bold text-sm">School ERP</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20
                         px-3 py-2 rounded-xl transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Student Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/15 backdrop-blur rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center
                              text-white text-2xl font-bold shrink-0 border-2 border-white/30">
                {student.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-white flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{student.full_name}</h2>
                <p className="text-purple-200 text-sm">Class {student.class_name} - {student.section}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-purple-100">
                  <span>🎫 {student.admission_no}</span>
                  <span>📋 Roll No: {student.roll_no}</span>
                  <span>📅 {student.academic_year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100
                           hover:shadow-md hover:scale-[1.02] transition-all duration-200
                           flex flex-col items-center text-center gap-2 active:scale-[0.98]">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color}
                                 flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
