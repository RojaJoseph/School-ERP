'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { PageSpinner } from '@/components/ui'
import api from '@/lib/api'
import { Student } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'react-toastify'
import {
  ArrowLeft, Edit2, Save, X, Camera, User, Phone, Mail,
  MapPin, Calendar, BookOpen, CreditCard, Loader2,
  CheckCircle, XCircle, Clock, Download,
} from 'lucide-react'

const GENDERS = ['male', 'female', 'other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12']

type Tab = 'profile' | 'attendance' | 'fees' | 'exams'

export default function StudentProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const photoRef = useRef<HTMLInputElement>(null)

  const [student,     setStudent]    = useState<Student | null>(null)
  const [loading,     setLoading]    = useState(true)
  const [editing,     setEditing]    = useState(false)
  const [saving,      setSaving]     = useState(false)
  const [uploadingPh, setUploadingPh]= useState(false)
  const [tab,         setTab]        = useState<Tab>('profile')
  const [form,        setForm]       = useState<Partial<Student>>({})

  // Related data
  const [attendance, setAttendance] = useState<any[]>([])
  const [fees,       setFees]       = useState<any[]>([])
  const [exams,      setExams]      = useState<any[]>([])

  useEffect(() => {
    fetchStudent()
  }, [id])

  useEffect(() => {
    if (tab === 'attendance') fetchAttendance()
    if (tab === 'fees')       fetchFees()
    if (tab === 'exams')      fetchExams()
  }, [tab])

  const fetchStudent = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/students/${id}`)
      setStudent(res.data)
      setForm(res.data)
    } catch {
      toast.error('Student not found')
      router.push('/students')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/attendance/student/${id}`)
      setAttendance(res.data.records || [])
    } catch { setAttendance([]) }
  }

  const fetchFees = async () => {
    try {
      const res = await api.get('/fees/payments', { params: { student_id: id, per_page: 50 } })
      setFees(res.data.payments || [])
    } catch { setFees([]) }
  }

  const fetchExams = async () => {
    try {
      const res = await api.get(`/exams/results/student/${id}`)
      setExams(Array.isArray(res.data) ? res.data : [])
    } catch { setExams([]) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put(`/students/${id}`, form)
      setStudent(res.data)
      setForm(res.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPh(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post(`/students/${id}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStudent(res.data)
      toast.success('Photo updated!')
    } catch {
      toast.error('Photo upload failed')
    } finally {
      setUploadingPh(false)
    }
  }

  const f = (k: keyof Student) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  if (loading) return <><Navbar title="Student Profile" /><div className="p-6"><PageSpinner /></div></>
  if (!student) return null

  const attPresent  = attendance.filter(a => a.status === 'present').length
  const attTotal    = attendance.length
  const attPct      = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0
  const feesPaid    = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paid_amount, 0)
  const feesPending = fees.filter(f => f.status !== 'paid' && f.status !== 'waived').reduce((s, f) => s + f.amount, 0)

  const photoSrc = student.photo
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${student.photo}`
    : null

  return (
    <>
      <Navbar title="Student Profile" />
      <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">

        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/students')} className="btn-secondary !py-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </button>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary !py-1.5">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(student) }} className="btn-secondary !py-1.5">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary !py-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Hero Card */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Photo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                {photoSrc ? (
                  <img src={photoSrc} alt={student.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => photoRef.current?.click()}
                disabled={uploadingPh}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center
                           justify-center text-white hover:bg-blue-700 transition-colors shadow-md"
                title="Change photo"
              >
                {uploadingPh ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            {/* Name + info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge-blue">Adm# {student.admission_no}</span>
                <span className="badge-green">Class {student.class_name}{student.section ? `-${student.section}` : ''}</span>
                <span className="badge-purple">{student.academic_year}</span>
                <span className={`${student.is_active ? 'badge-green' : 'badge-red'}`}>
                  {student.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                {student.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{student.email}</span>}
                {student.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{student.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />DOB: {formatDate(student.date_of_birth)}</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-2 text-center shrink-0">
              <div className="bg-blue-50 rounded-xl px-4 py-2">
                <p className="text-xl font-bold text-blue-600">{attPct}%</p>
                <p className="text-xs text-blue-400">Attendance</p>
              </div>
              <div className="bg-green-50 rounded-xl px-4 py-2">
                <p className="text-sm font-bold text-green-600">{formatCurrency(feesPaid)}</p>
                <p className="text-xs text-green-400">Paid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {(['profile', 'attendance', 'fees', 'exams'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'profile' ? '👤 Profile' : t === 'attendance' ? '📋 Attendance' : t === 'fees' ? '💰 Fees' : '📝 Exams'}
              </button>
            ))}
          </div>
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Personal Info */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  {editing
                    ? <input className="input" value={form.first_name || ''} onChange={f('first_name')} />
                    : <p className="text-sm text-gray-900 font-medium">{student.first_name}</p>
                  }
                </div>
                <div>
                  <label className="label">Last Name</label>
                  {editing
                    ? <input className="input" value={form.last_name || ''} onChange={f('last_name')} />
                    : <p className="text-sm text-gray-900 font-medium">{student.last_name}</p>
                  }
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  {editing
                    ? <input type="date" className="input" value={form.date_of_birth || ''} onChange={f('date_of_birth')} />
                    : <p className="text-sm text-gray-700">{formatDate(student.date_of_birth)}</p>
                  }
                </div>
                <div>
                  <label className="label">Gender</label>
                  {editing
                    ? <select className="input" value={form.gender || ''} onChange={f('gender')}>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    : <p className="text-sm text-gray-700 capitalize">{student.gender}</p>
                  }
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  {editing
                    ? <select className="input" value={form.blood_group || ''} onChange={f('blood_group')}>
                        <option value="">None</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    : <p className="text-sm text-gray-700">{student.blood_group || '—'}</p>
                  }
                </div>
                <div>
                  <label className="label">Roll No</label>
                  {editing
                    ? <input className="input" value={form.roll_no || ''} onChange={f('roll_no')} />
                    : <p className="text-sm text-gray-700">{student.roll_no || '—'}</p>
                  }
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" /> Contact Details
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Email',   key: 'email',   type: 'email' },
                  { label: 'Phone',   key: 'phone',   type: 'tel' },
                  { label: 'City',    key: 'city',    type: 'text' },
                  { label: 'State',   key: 'state',   type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    {editing
                      ? <input type={type} className="input" value={(form as any)[key] || ''} onChange={f(key as keyof Student)} />
                      : <p className="text-sm text-gray-700">{(student as any)[key] || '—'}</p>
                    }
                  </div>
                ))}
                <div>
                  <label className="label">Address</label>
                  {editing
                    ? <textarea className="input" rows={2} value={form.address || ''} onChange={f('address')} />
                    : <p className="text-sm text-gray-700">{student.address || '—'}</p>
                  }
                </div>
              </div>
            </div>

            {/* Academic */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Academic Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class</label>
                  {editing
                    ? <select className="input" value={form.class_name || ''} onChange={f('class_name')}>
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    : <p className="text-sm text-gray-700">Class {student.class_name}</p>
                  }
                </div>
                <div>
                  <label className="label">Section</label>
                  {editing
                    ? <input className="input" value={form.section || ''} onChange={f('section')} placeholder="A" />
                    : <p className="text-sm text-gray-700">{student.section || '—'}</p>
                  }
                </div>
                <div className="col-span-2">
                  <label className="label">Academic Year</label>
                  {editing
                    ? <input className="input" value={form.academic_year || ''} onChange={f('academic_year')} />
                    : <p className="text-sm text-gray-700">{student.academic_year}</p>
                  }
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Guardian Information
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Guardian Name',  key: 'guardian_name' },
                  { label: 'Guardian Phone', key: 'guardian_phone' },
                  { label: 'Guardian Email', key: 'guardian_email' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    {editing
                      ? <input className="input" value={(form as any)[key] || ''} onChange={f(key as keyof Student)} />
                      : <p className="text-sm text-gray-700">{(student as any)[key] || '—'}</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {tab === 'attendance' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Recent Attendance (Last 30 records)</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Present: {attPresent}</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> Absent: {attTotal - attPresent}</span>
                <span className={`font-bold ${attPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attPct}%</span>
              </div>
            </div>
            {attendance.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No attendance records yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {attendance.map(a => (
                  <div key={a.id} className={`p-2 rounded-lg text-center text-xs border
                    ${a.status === 'present' ? 'bg-green-50 border-green-200 text-green-700' :
                      a.status === 'absent'  ? 'bg-red-50 border-red-200 text-red-600' :
                      a.status === 'late'    ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                              'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    <p className="font-medium">{formatDate(a.date)}</p>
                    <p className="capitalize font-semibold">{a.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FEES TAB ── */}
        {tab === 'fees' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-xl font-bold text-green-600">{formatCurrency(feesPaid)}</p>
                <p className="text-xs text-gray-500">Total Paid</p>
              </div>
              <div className="card text-center">
                <p className="text-xl font-bold text-red-500">{formatCurrency(feesPending)}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="card text-center">
                <p className="text-xl font-bold text-gray-700">{fees.length}</p>
                <p className="text-xs text-gray-500">Total Invoices</p>
              </div>
            </div>
            <div className="card !p-0 overflow-hidden">
              {fees.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No fee records</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Invoice','Amount','Paid','Status','Method','Due'].map(h => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map(fee => (
                      <tr key={fee.id} className="table-row">
                        <td className="table-cell font-mono text-blue-600 text-xs">{fee.invoice_no}</td>
                        <td className="table-cell">{formatCurrency(fee.amount)}</td>
                        <td className="table-cell text-green-600">{formatCurrency(fee.paid_amount)}</td>
                        <td className="table-cell">
                          <span className={fee.status === 'paid' ? 'badge-green' : fee.status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="table-cell text-gray-500 capitalize">{fee.payment_method || '—'}</td>
                        <td className="table-cell text-gray-400">{fee.due_date ? formatDate(fee.due_date) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── EXAMS TAB ── */}
        {tab === 'exams' && (
          <div className="card !p-0 overflow-hidden">
            {exams.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No exam results yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Exam','Subject','Marks','Grade','Status'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exams.map((r: any) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-medium">{r.exam?.name || `Exam #${r.exam_id}`}</td>
                      <td className="table-cell text-gray-500">{r.exam?.subject || '—'}</td>
                      <td className="table-cell">{r.is_absent ? '—' : `${r.marks} / ${r.exam?.total_marks || '—'}`}</td>
                      <td className="table-cell">
                        {r.grade
                          ? <span className={`font-bold ${r.grade.startsWith('A') ? 'text-green-600' : r.grade === 'F' ? 'text-red-600' : 'text-yellow-600'}`}>{r.grade}</span>
                          : '—'}
                      </td>
                      <td className="table-cell">
                        {r.is_absent ? <span className="badge-red">Absent</span> : <span className="badge-green">Present</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </>
  )
}
