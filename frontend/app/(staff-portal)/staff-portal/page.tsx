'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { Briefcase, Mail, Lock, Loader2, ArrowRight, Shield } from 'lucide-react'

export default function StaffPortalLogin() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  // Allowed roles for staff portal
  const ALLOWED_ROLES = ['teacher', 'school_admin', 'sub_admin', 'hr_manager', 'super_admin']

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData()
      form.append('username', email)
      form.append('password', password)
      const res = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { access_token, user } = res.data

      if (!ALLOWED_ROLES.includes(user.role)) {
        toast.error('Access denied. This portal is for staff only.')
        return
      }

      // Store in staff portal session
      localStorage.setItem('staff_token', access_token)
      localStorage.setItem('staff_user',  JSON.stringify(user))

      toast.success(`Welcome, ${user.full_name}! 👋`)
      router.push('/staff-portal/home')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-4">
            <Briefcase className="w-10 h-10 text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold text-white">Staff Portal</h1>
          <p className="text-blue-300 mt-1 text-sm">Teachers · Principal · Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Sign In</h2>
          <p className="text-sm text-gray-400 mb-6">Use your school ERP credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="input pl-10" placeholder="you@school.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" className="input pl-10" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white
                         py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><ArrowRight className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          <div className="mt-5 p-3 bg-blue-50 rounded-xl text-xs text-blue-600 flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Attendance is verified using <strong>GPS location + AI Face Recognition</strong></span>
          </div>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          © {new Date().getFullYear()} School ERP · Staff Portal
        </p>
      </div>
    </div>
  )
}
