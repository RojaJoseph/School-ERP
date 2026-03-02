'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner } from '@/components/ui'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { useAuthStore } from '@/store/authStore'
import {
  Shield, Search, UserPlus, Loader2, Check, X,
  ChevronDown, ChevronUp, Users, Mail, Phone,
  ToggleLeft, ToggleRight, Save, Eye, Edit, Trash,
  Download, CheckSquare, Square,
} from 'lucide-react'

const MODULES = [
  { key: 'dashboard',     label: '📊 Dashboard',     },
  { key: 'students',      label: '👨‍🎓 Students',      },
  { key: 'admissions',    label: '📋 Admissions',     },
  { key: 'attendance',    label: '✅ Attendance',     },
  { key: 'exams',         label: '📝 Exams',          },
  { key: 'fees',          label: '💰 Fees',           },
  { key: 'hr',            label: '👔 HR & Payroll',   },
  { key: 'transport',     label: '🚌 Transport',      },
  { key: 'library',       label: '📚 Library',        },
  { key: 'inventory',     label: '📦 Inventory',      },
  { key: 'timetable',     label: '📅 Timetable',      },
  { key: 'reports',       label: '📈 Reports',        },
  { key: 'communication', label: '💬 Communication',  },
]

const ACTIONS = [
  { key: 'can_view',    label: 'View'    },
  { key: 'can_create',  label: 'Create'  },
  { key: 'can_edit',    label: 'Edit'    },
  { key: 'can_delete',  label: 'Delete'  },
  { key: 'can_export',  label: 'Export'  },
  { key: 'can_approve', label: 'Approve' },
]

const ROLES = ['teacher', 'accountant', 'hr_manager', 'librarian', 'transport_mgr', 'sub_admin']

const roleLabel = (role: string) =>
  role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const roleColor: Record<string, string> = {
  teacher:       'badge-blue',
  accountant:    'badge-green',
  hr_manager:    'badge-purple',
  librarian:     'badge-orange',
  transport_mgr: 'badge-yellow',
  sub_admin:     'badge-red',
  school_admin:  'badge-purple',
}

interface User {
  id: number
  full_name: string
  email: string
  phone?: string
  role: string
  is_active: boolean
}

interface Permission {
  module: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_export: boolean
  can_approve: boolean
}

const emptyPerms = (): Permission[] =>
  MODULES.map(m => ({
    module: m.key, can_view: false, can_create: false,
    can_edit: false, can_delete: false, can_export: false, can_approve: false,
  }))

const EMPTY_USER_FORM = {
  full_name: '', email: '', phone: '', password: '', role: 'teacher'
}

export default function PermissionsPage() {
  const { user: currentUser } = useAuthStore()
  const [users,        setUsers]       = useState<User[]>([])
  const [loading,      setLoading]     = useState(true)
  const [search,       setSearch]      = useState('')
  const [roleFilter,   setRoleFilter]  = useState('')
  const [selectedUser, setSelectedUser]= useState<User | null>(null)
  const [perms,        setPerms]       = useState<Permission[]>(emptyPerms())
  const [loadingPerms, setLoadingPerms]= useState(false)
  const [saving,       setSaving]      = useState(false)
  const [showAddUser,  setShowAddUser] = useState(false)
  const [addForm,      setAddForm]     = useState({ ...EMPTY_USER_FORM })
  const [addSaving,    setAddSaving]   = useState(false)
  const [expandedUser, setExpandedUser]= useState<number | null>(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/permissions/users')
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const loadPerms = async (user: User) => {
    if (expandedUser === user.id) {
      setExpandedUser(null)
      setSelectedUser(null)
      return
    }
    setExpandedUser(user.id)
    setSelectedUser(user)
    setLoadingPerms(true)
    try {
      const res = await api.get(`/permissions/users/${user.id}`)
      setPerms(res.data.permissions)
    } catch { toast.error('Failed to load permissions') }
    finally { setLoadingPerms(false) }
  }

  const togglePerm = (module: string, action: string) => {
    setPerms(prev => prev.map(p =>
      p.module === module ? { ...p, [action]: !(p as any)[action] } : p
    ))
  }

  // When can_view is turned off, turn off all others too
  const toggleView = (module: string) => {
    setPerms(prev => prev.map(p => {
      if (p.module !== module) return p
      const newView = !p.can_view
      return newView
        ? { ...p, can_view: true }
        : { module, can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false, can_approve: false }
    }))
  }

  const grantAll = (module: string) => {
    setPerms(prev => prev.map(p =>
      p.module === module
        ? { module, can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true, can_approve: true }
        : p
    ))
  }

  const revokeAll = (module: string) => {
    setPerms(prev => prev.map(p =>
      p.module === module
        ? { module, can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false, can_approve: false }
        : p
    ))
  }

  const grantAllModules = () => {
    setPerms(emptyPerms().map(p => ({
      ...p, can_view: true, can_create: true, can_edit: true,
      can_delete: true, can_export: true, can_approve: true
    })))
  }

  const revokeAllModules = () => { setPerms(emptyPerms()) }

  const savePerms = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await api.post(`/permissions/users/${selectedUser.id}`, perms)
      toast.success(`✅ Permissions saved for ${selectedUser.full_name}`)
    } catch { toast.error('Failed to save permissions') }
    finally { setSaving(false) }
  }

  const toggleActive = async (user: User) => {
    try {
      const res = await api.patch(`/permissions/users/${user.id}/toggle`)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: res.data.is_active } : u))
      toast.success(res.data.message)
    } catch { toast.error('Failed to update user') }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    try {
      await api.post('/permissions/users/create', addForm)
      toast.success(`✅ User ${addForm.full_name} created!`)
      setShowAddUser(false)
      setAddForm({ ...EMPTY_USER_FORM })
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create user')
    } finally { setAddSaving(false) }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  if (loading) return <><Navbar title="Permissions" /><div className="p-6"><PageSpinner /></div></>

  return (
    <>
      <Navbar title="User Permissions" />
      <div className="p-4 lg:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" /> User Permission Manager
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Control which modules each user can access
            </p>
          </div>
          <button onClick={() => setShowAddUser(true)} className="btn-primary w-fit">
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Filters */}
        <div className="card !p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-48" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active',      value: users.filter(u => u.is_active).length,  color: 'text-green-600 bg-green-50' },
            { label: 'Inactive',    value: users.filter(u => !u.is_active).length, color: 'text-red-500 bg-red-50' },
            { label: 'Roles',       value: [...new Set(users.map(u => u.role))].length, color: 'text-purple-600 bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-75">{s.label}</p>
            </div>
          ))}
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No users found</div>
          ) : filtered.map(user => (
            <div key={user.id} className="card !p-0 overflow-hidden">
              {/* User Row */}
              <div className="flex items-center gap-4 p-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center
                                text-white font-bold text-lg shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                    <span className={roleColor[user.role] || 'badge-blue'}>
                      {roleLabel(user.role)}
                    </span>
                    {!user.is_active && <span className="badge-red">Inactive</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                    {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(user)}
                    title={user.is_active ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-lg transition-colors ${user.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    {user.is_active
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => loadPerms(user)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${expandedUser === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    <Shield className="w-4 h-4" />
                    {expandedUser === user.id ? 'Close' : 'Permissions'}
                    {expandedUser === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Permissions Panel */}
              {expandedUser === user.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  {loadingPerms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {/* Quick actions */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-700">
                          Module Access for <span className="text-blue-600">{user.full_name}</span>
                        </p>
                        <div className="flex gap-2">
                          <button onClick={grantAllModules} className="btn-secondary !py-1 !text-xs">
                            <CheckSquare className="w-3 h-3" /> Grant All
                          </button>
                          <button onClick={revokeAllModules} className="btn-secondary !py-1 !text-xs text-red-500">
                            <Square className="w-3 h-3" /> Revoke All
                          </button>
                          <button onClick={savePerms} disabled={saving} className="btn-primary !py-1 !text-xs">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Permission Grid */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-sm min-w-[700px]">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="text-left px-4 py-2.5 font-semibold text-sm w-48">Module</th>
                              {ACTIONS.map(a => (
                                <th key={a.key} className="text-center px-2 py-2.5 font-semibold text-sm">{a.label}</th>
                              ))}
                              <th className="text-center px-2 py-2.5 font-semibold text-sm">Quick</th>
                            </tr>
                          </thead>
                          <tbody>
                            {MODULES.map((mod, idx) => {
                              const perm = perms.find(p => p.module === mod.key) || emptyPerms()[0]
                              const hasAny = ACTIONS.some(a => (perm as any)[a.key])
                              return (
                                <tr key={mod.key} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${!perm.can_view ? 'opacity-60' : ''}`}>
                                  <td className="px-4 py-3">
                                    <span className="font-medium text-gray-800">{mod.label}</span>
                                  </td>
                                  {ACTIONS.map(action => (
                                    <td key={action.key} className="text-center px-2 py-3">
                                      <button
                                        onClick={() => action.key === 'can_view' ? toggleView(mod.key) : togglePerm(mod.key, action.key)}
                                        disabled={action.key !== 'can_view' && !perm.can_view}
                                        className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors
                                          ${(perm as any)[action.key]
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}
                                          ${action.key !== 'can_view' && !perm.can_view ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                                      >
                                        {(perm as any)[action.key] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                                      </button>
                                    </td>
                                  ))}
                                  <td className="text-center px-2 py-3">
                                    <button
                                      onClick={() => hasAny ? revokeAll(mod.key) : grantAll(mod.key)}
                                      className={`text-xs px-2 py-1 rounded font-medium transition-colors
                                        ${hasAny
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                    >
                                      {hasAny ? 'Revoke' : 'Grant'}
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Save button at bottom */}
                      <div className="flex justify-end mt-4">
                        <button onClick={savePerms} disabled={saving} className="btn-primary">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Permissions for {user.full_name}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        open={showAddUser}
        onClose={() => { setShowAddUser(false); setAddForm({ ...EMPTY_USER_FORM }) }}
        title="Add New User"
        size="md"
        footer={
          <>
            <button onClick={() => setShowAddUser(false)} className="btn-secondary">Cancel</button>
            <button form="add-user-form" type="submit" disabled={addSaving} className="btn-primary">
              {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create User
            </button>
          </>
        }
      >
        <form id="add-user-form" onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" required value={addForm.full_name}
                onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Ms. Priya Kumar" />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input type="email" className="input" required value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="teacher@school.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={addForm.phone}
                onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={addForm.role}
                onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Password *</label>
              <input type="password" className="input" required value={addForm.password}
                onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Minimum 6 characters" minLength={6} />
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
            💡 After creating the user, click <strong>Permissions</strong> on their row to set module access.
          </div>
        </form>
      </Modal>
    </>
  )
}
