'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, EmptyState } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { usePagination } from '@/hooks'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-toastify'
import {
  Bell, MessageSquare, Send, Plus, Inbox, CheckCheck,
  Megaphone, Loader2, Search, Trash2,
} from 'lucide-react'

interface Notification {
  id: number
  title: string
  message: string
  type: string
  target_role: string
  status: string
  created_at: string
}

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  subject?: string
  body: string
  is_read: boolean
  created_at: string
}

const TARGET_ROLES = ['all', 'teacher', 'student', 'parent', 'staff']
const NOTIF_TYPES  = ['internal', 'email', 'sms', 'push']

export default function CommunicationPage() {
  const { user } = useAuthStore()
  const [tab,           setTab]           = useState<'notifications' | 'inbox' | 'sent'>('notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [inbox,         setInbox]         = useState<Message[]>([])
  const [sent,          setSent]          = useState<Message[]>([])
  const [loading,       setLoading]       = useState(false)
  const [showNotifModal,setShowNotifModal] = useState(false)
  const [showMsgModal,  setShowMsgModal]  = useState(false)
  const [selected,      setSelected]      = useState<Message | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [search,        setSearch]        = useState('')

  const { page, perPage, setPage, totalPages } = usePagination(15)

  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'internal', target_role: 'all' })
  const [msgForm,   setMsgForm]   = useState({ receiver_id: '', subject: '', body: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'notifications') {
        const res = await api.get('/communication/notifications', { params: { page, per_page: perPage } })
        setNotifications(res.data.notifications || res.data)
      } else if (tab === 'inbox') {
        const res = await api.get('/communication/messages/inbox', { params: { page, per_page: perPage } })
        setInbox(res.data.messages || res.data)
      } else {
        const res = await api.get('/communication/messages/sent', { params: { page, per_page: perPage } })
        setSent(res.data.messages || res.data)
      }
    } catch {
      // API might not be populated yet
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tab, page])

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/communication/notifications', notifForm)
      toast.success('Notification sent!')
      setShowNotifModal(false)
      setNotifForm({ title: '', message: '', type: 'internal', target_role: 'all' })
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send')
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgForm.receiver_id) { toast.error('Enter receiver ID'); return }
    setSaving(true)
    try {
      await api.post('/communication/messages', { ...msgForm, receiver_id: parseInt(msgForm.receiver_id) })
      toast.success('Message sent!')
      setShowMsgModal(false)
      setMsgForm({ receiver_id: '', subject: '', body: '' })
      if (tab === 'sent') fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send')
    } finally {
      setSaving(false)
    }
  }

  const markRead = async (msg: Message) => {
    if (!msg.is_read) {
      try {
        await api.patch(`/communication/messages/${msg.id}/read`)
        fetchData()
      } catch {}
    }
    setSelected(msg)
  }

  const typeBadge = (t: string) => {
    const m: any = { email: 'badge-blue', sms: 'badge-green', push: 'badge-yellow', internal: 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium' }
    return m[t] || 'badge-blue'
  }

  const statusBadge = (s: string) => {
    return s === 'sent' ? 'badge-green' : s === 'failed' ? 'badge-red' : 'badge-yellow'
  }

  const filteredNotifs = notifications.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase())
  )
  const filteredInbox = inbox.filter(m =>
    !search || m.body.toLowerCase().includes(search.toLowerCase()) || (m.subject || '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredSent = sent.filter(m =>
    !search || m.body.toLowerCase().includes(search.toLowerCase()) || (m.subject || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar title="Communication" />
      <div className="p-6 space-y-5">

        <PageHeader title="Communication" subtitle="Send notifications and messages to staff, students, and parents">
          <button onClick={() => setShowMsgModal(true)} className="btn-secondary">
            <MessageSquare className="w-4 h-4" /> New Message
          </button>
          <button onClick={() => setShowNotifModal(true)} className="btn-primary">
            <Megaphone className="w-4 h-4" /> Send Notification
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Notifications', icon: Bell,         color: 'bg-blue-500',   count: notifications.length },
            { label: 'Inbox Messages',       icon: Inbox,        color: 'bg-purple-500', count: inbox.length },
            { label: 'Unread Messages',      icon: MessageSquare, color: 'bg-red-500',   count: inbox.filter(m => !m.is_read).length },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {(['notifications', 'inbox', 'sent'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1) }}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'notifications' ? '📢 Notifications' : t === 'inbox' ? '📥 Inbox' : '📤 Sent'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : tab === 'notifications' ? (
          <div className="card !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Title', 'Message', 'Type', 'Target', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredNotifs.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState icon={Bell} title="No notifications yet" message="Send your first notification to staff or students." action={{ label: 'Send Notification', onClick: () => setShowNotifModal(true) }} />
                  </td></tr>
                ) : filteredNotifs.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{n.title}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{n.message}</td>
                    <td className="px-4 py-3"><span className={typeBadge(n.type)}>{n.type}</span></td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{n.target_role || 'all'}</td>
                    <td className="px-4 py-3"><span className={statusBadge(n.status)}>{n.status}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {(tab === 'inbox' ? filteredInbox : filteredSent).length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={tab === 'inbox' ? 'Inbox is empty' : 'No sent messages'}
                message="Messages will appear here once received or sent."
              />
            ) : (tab === 'inbox' ? filteredInbox : filteredSent).map(msg => (
              <div
                key={msg.id}
                onClick={() => markRead(msg)}
                className={`card !p-4 cursor-pointer hover:shadow-md transition-all
                  ${!msg.is_read && tab === 'inbox' ? 'border-l-4 border-blue-500 bg-blue-50/30' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                      {tab === 'inbox' ? msg.sender_id : msg.receiver_id}
                    </div>
                    <div>
                      <p className={`text-sm ${!msg.is_read && tab === 'inbox' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {msg.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-sm">{msg.body}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.is_read && tab === 'inbox' && <CheckCheck className="w-4 h-4 text-blue-400" />}
                    <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message View Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.subject || '(No subject)'} size="md">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                {selected.sender_id}
              </div>
              <div>
                <p className="text-gray-500">From user ID <span className="font-medium text-gray-700">#{selected.sender_id}</span></p>
                <p className="text-xs text-gray-400">{formatDate(selected.created_at)}</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.body}</p>
          </div>
        </Modal>
      )}

      {/* Send Notification Modal */}
      <Modal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Send Notification"
        size="md"
        footer={
          <>
            <button onClick={() => setShowNotifModal(false)} className="btn-secondary">Cancel</button>
            <button form="notif-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send</>}
            </button>
          </>
        }
      >
        <form id="notif-form" onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input" rows={4} value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={notifForm.type} onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}>
                {NOTIF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Target</label>
              <select className="input" value={notifForm.target_role} onChange={e => setNotifForm(f => ({ ...f, target_role: e.target.value }))}>
                {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* New Message Modal */}
      <Modal
        open={showMsgModal}
        onClose={() => setShowMsgModal(false)}
        title="New Message"
        size="md"
        footer={
          <>
            <button onClick={() => setShowMsgModal(false)} className="btn-secondary">Cancel</button>
            <button form="msg-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
            </button>
          </>
        }
      >
        <form id="msg-form" onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="label">Receiver User ID *</label>
            <input type="number" className="input" placeholder="Enter user ID" value={msgForm.receiver_id} onChange={e => setMsgForm(f => ({ ...f, receiver_id: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" placeholder="Message subject" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input" rows={5} placeholder="Write your message..." value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))} required />
          </div>
        </form>
      </Modal>
    </>
  )
}
