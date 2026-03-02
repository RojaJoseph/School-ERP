'use client'
import { create } from 'zustand'
import api from '@/lib/api'

export interface Permission {
  module:     string
  can_view:   boolean
  can_create: boolean
  can_edit:   boolean
  can_delete: boolean
  can_export: boolean
  can_approve:boolean
}

export interface User {
  id:          number
  full_name:   string
  email:       string
  role:        string
  phone?:      string
  permissions: Permission[]
}

interface AuthState {
  user:            User | null
  token:           string | null
  isLoading:       boolean
  login:           (email: string, password: string) => Promise<void>
  logout:          () => void
  loadFromStorage: () => void
  hasPermission:   (module: string, action?: string) => boolean
  updatePermissions: (permissions: Permission[]) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  token:     null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const user  = localStorage.getItem('user')
      if (token && user) {
        set({ token, user: JSON.parse(user) })
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user } = res.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ token: access_token, user, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
    window.location.href = '/login'
  },

  // Check if current user has permission for a module
  hasPermission: (module: string, action = 'can_view') => {
    const { user } = get()
    if (!user) return false
    // Super admin and school_admin have full access always
    if (['super_admin', 'school_admin'].includes(user.role)) return true
    // sub_admin has full access
    if (user.role === 'sub_admin') return true
    // Check specific permission
    const perm = user.permissions?.find(p => p.module === module)
    if (!perm) return false
    return (perm as any)[action] === true
  },

  updatePermissions: (permissions: Permission[]) => {
    const { user } = get()
    if (!user) return
    const updated = { ...user, permissions }
    localStorage.setItem('user', JSON.stringify(updated))
    set({ user: updated })
  },
}))
