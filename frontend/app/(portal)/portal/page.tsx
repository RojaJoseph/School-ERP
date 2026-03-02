'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { GraduationCap, User, Phone, Loader2, BookOpen, ArrowRight } from 'lucide-react'

export default function PortalLoginPage() {
  const router = useRouter()
  const [name,     setName]    = useState('')
  const [phone,    setPhone]   = useState('')
  const [loading,  setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast.error('Please enter both name and phone number')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/portal/login', { name: name.trim(), phone: phone.trim() })
      const { student } = res.data
      localStorage.setItem('portal_student', JSON.stringify(student))
      toast.success(`Welcome, ${student.name}! 🎉`)
      router.push('/portal/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Student not found. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-5">
            <GraduationCap className="w-11 h-11 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Student Portal</h1>
          <p className="text-indigo-200 mt-2 text-sm">Access your school information</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your name and phone number to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Student / Parent Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-10"
                  placeholder="e.g. Arjun Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-10"
                  placeholder="Student or parent phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  type="tel"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                         text-white py-3 rounded-xl font-semibold transition-colors
                         flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><ArrowRight className="w-4 h-4" /> Access Portal</>}
            </button>
          </form>

          <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-xs text-indigo-600">
            <p className="font-semibold mb-1">💡 Login Help</p>
            <p>Use the phone number registered with the school (student's or guardian's).</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: BookOpen, label: 'Homework' },
            { icon: GraduationCap, label: 'Results' },
            { icon: User, label: 'Profile' },
          ].map(item => (
            <div key={item.label} className="bg-white/20 backdrop-blur rounded-2xl p-3">
              <item.icon className="w-5 h-5 text-white mx-auto mb-1" />
              <p className="text-white text-xs font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-indigo-200 text-xs mt-6">
          © {new Date().getFullYear()} School ERP · Student Portal
        </p>
      </div>
    </div>
  )
}
