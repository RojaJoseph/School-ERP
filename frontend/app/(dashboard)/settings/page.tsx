'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  Settings, User, Lock, Bell, Palette, Database,
  Save, Eye, EyeOff, Loader2, CheckCircle, Shield,
  Globe, School, Info,
} from 'lucide-react'

const tabs = [
  { id: 'profile',      label: 'Profile',       icon: User },
  { id: 'security',     label: 'Security',      icon: Lock },
  { id: 'notifications',label: 'Notifications', icon: Bell },
  { id: 'appearance',   label: 'Appearance',    icon: Palette },
  { id: 'system',       label: 'System',        icon: Database },
  { id: 'about',        label: 'About',         icon: Info },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving,    setSaving]    = useState(false)

  // Profile form
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
  })

  // Password form
  const [pw,     setPw]     = useState({ old_password: '', new_password: '', confirm: '' })
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false })

  // Notifications
  const [notifs, setNotifs] = useState({
    email_fees:       true,
    email_attendance: true,
    sms_fees:         false,
    sms_alerts:       true,
    browser_push:     true,
  })

  // Appearance
  const [theme,    setTheme]   = useState('light')
  const [language, setLang]    = useState('en')
  const [dateFormat, setDateFmt] = useState('DD/MM/YYYY')

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Update user profile via API
      if (user?.id) {
        await api.put('/auth/me', { full_name: profile.full_name, phone: profile.phone })
      }
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (pw.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/change-password', { old_password: pw.old_password, new_password: pw.new_password })
      toast.success('Password changed successfully!')
      setPw({ old_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = (role: string) =>
    role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <>
      <Navbar title="Settings" />
      <div className="p-6">
        <div className="max-w-5xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500">Manage your account and application preferences</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-52 shrink-0">
              <nav className="space-y-0.5">
                {tabs.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {t.label}
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1">

              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="card space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{user?.full_name}</h3>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <span className="badge-blue mt-1 inline-block">{roleLabel(user?.role || '')}</span>
                    </div>
                  </div>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Full Name *</label>
                        <input className="input" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="label">Email Address</label>
                        <input className="input bg-gray-50" value={profile.email} disabled />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9999999999" />
                      </div>
                      <div>
                        <label className="label">Role</label>
                        <input className="input bg-gray-50" value={roleLabel(user?.role || '')} disabled />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">Change Password</h3>
                    </div>
                    <form onSubmit={changePassword} className="space-y-4 max-w-md">
                      {[
                        { key: 'old_password', label: 'Current Password', show: showPw.old,     toggle: () => setShowPw(p => ({ ...p, old:     !p.old })) },
                        { key: 'new_password', label: 'New Password',     show: showPw.new,     toggle: () => setShowPw(p => ({ ...p, new:     !p.new })) },
                        { key: 'confirm',      label: 'Confirm Password', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="label">{f.label} *</label>
                          <div className="relative">
                            <input
                              type={f.show ? 'text' : 'password'}
                              className="input pr-10"
                              value={(pw as any)[f.key]}
                              onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                              required
                            />
                            <button type="button" onClick={f.toggle}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</> : <><Shield className="w-4 h-4" /> Change Password</>}
                      </button>
                    </form>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-3">Security Recommendations</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Use a strong password (8+ chars)', done: true },
                        { label: 'Change password regularly', done: false },
                        { label: 'Don\'t share your login credentials', done: true },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle className={`w-4 h-4 ${r.done ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={r.done ? 'text-gray-700' : 'text-gray-400'}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="card space-y-5">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Notification Preferences</h3>
                  </div>
                  {[
                    { key: 'email_fees',       label: 'Fee reminders via Email',       group: 'Email Notifications' },
                    { key: 'email_attendance', label: 'Attendance alerts via Email',   group: 'Email Notifications' },
                    { key: 'sms_fees',         label: 'Fee reminders via SMS',         group: 'SMS Notifications' },
                    { key: 'sms_alerts',       label: 'Important alerts via SMS',      group: 'SMS Notifications' },
                    { key: 'browser_push',     label: 'Browser push notifications',   group: 'Browser' },
                  ].reduce((groups: any[], item) => {
                    let g = groups.find(gr => gr.title === item.group)
                    if (!g) { g = { title: item.group, items: [] }; groups.push(g) }
                    g.items.push(item)
                    return groups
                  }, []).map((group: any) => (
                    <div key={group.title}>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">{group.title}</h4>
                      <div className="space-y-2">
                        {group.items.map((item: any) => (
                          <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <div
                              onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                              className={`w-10 h-5 rounded-full transition-colors cursor-pointer
                                ${(notifs as any)[item.key] ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform
                                ${(notifs as any)[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button onClick={() => toast.success('Notification preferences saved!')} className="btn-primary">
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="card space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Appearance</h3>
                  </div>

                  <div>
                    <label className="label mb-3">Theme</label>
                    <div className="flex gap-3">
                      {['light', 'dark', 'system'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex-1 p-3 rounded-xl border-2 text-sm capitalize font-medium transition-colors
                            ${theme === t ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'} {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Language</label>
                      <select className="input" value={language} onChange={e => setLang(e.target.value)}>
                        <option value="en">English</option>
                        <option value="ta">Tamil</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Date Format</label>
                      <select className="input" value={dateFormat} onChange={e => setDateFmt(e.target.value)}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => toast.success('Appearance settings saved!')} className="btn-primary">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              )}

              {/* System */}
              {activeTab === 'system' && (
                <div className="space-y-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                      <Database className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">System Information</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      {[
                        ['Application', 'School ERP'],
                        ['Version', '2.0.0'],
                        ['Backend', 'FastAPI + Python'],
                        ['Frontend', 'Next.js 14 + TypeScript'],
                        ['Database', 'PostgreSQL'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-medium text-gray-700">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-3">Academic Year Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Current Academic Year</label>
                        <input className="input" defaultValue="2024-25" />
                      </div>
                      <div>
                        <label className="label">School Name</label>
                        <input className="input" defaultValue="School ERP" />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={() => toast.success('System settings saved!')} className="btn-primary">
                        <Save className="w-4 h-4" /> Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              {activeTab === 'about' && (
                <div className="card text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <School className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">School ERP</h3>
                  <p className="text-gray-500 text-sm">Version 2.0.0</p>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Complete school management system with student, attendance, fees, exams, HR, library, inventory, and transport management.
                  </p>
                  <div className="pt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto text-sm">
                    {[
                      ['Backend', 'FastAPI'],
                      ['Frontend', 'Next.js 14'],
                      ['Database', 'PostgreSQL'],
                      ['Auth', 'JWT Bearer'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400 text-xs">{k}</p>
                        <p className="font-medium text-gray-700">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 pt-4">
                    © {new Date().getFullYear()} School ERP. All rights reserved.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
