'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { Loader2, Save, ArrowLeft } from 'lucide-react'

const classes = ['1','2','3','4','5','6','7','8','9','10','11','12']
const sections = ['A','B','C','D','E']

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    admission_no: '', roll_no: '', first_name: '', last_name: '',
    date_of_birth: '', gender: 'male', blood_group: '',
    email: '', phone: '', address: '', city: '', state: '', pincode: '',
    class_name: '1', section: 'A', academic_year: '2024-25',
    guardian_name: '', guardian_relation: '', guardian_phone: '',
    guardian_email: '', guardian_occupation: '',
    nationality: 'Indian', religion: '', caste: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/students', form)
      toast.success('Student added successfully!')
      router.push('/students')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar title="Add New Student" />
      <div className="p-6 max-w-4xl">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
            <p className="text-sm text-gray-500">Fill in all required details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Admission No *</label>
                <input className="input" value={form.admission_no} onChange={e => set('admission_no', e.target.value)} required />
              </div>
              <div>
                <label className="label">Roll No</label>
                <input className="input" value={form.roll_no} onChange={e => set('roll_no', e.target.value)} />
              </div>
              <div>
                <label className="label">First Name *</label>
                <input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input type="date" className="input" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select className="input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Class *</label>
                <select className="input" value={form.class_name} onChange={e => set('class_name', e.target.value)} required>
                  {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select className="input" value={form.section} onChange={e => set('section', e.target.value)}>
                  {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Academic Year *</label>
                <input className="input" value={form.academic_year} onChange={e => set('academic_year', e.target.value)} placeholder="2024-25" required />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="label">Address</label>
                <textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div><label className="label">City</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
              <div><label className="label">State</label><input className="input" value={form.state} onChange={e => set('state', e.target.value)} /></div>
              <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={e => set('pincode', e.target.value)} /></div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Guardian Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Guardian Name *</label>
                <input className="input" value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Relation</label>
                <input className="input" value={form.guardian_relation} onChange={e => set('guardian_relation', e.target.value)} placeholder="Father / Mother" />
              </div>
              <div>
                <label className="label">Guardian Phone *</label>
                <input className="input" value={form.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} required />
              </div>
              <div>
                <label className="label">Guardian Email</label>
                <input type="email" className="input" value={form.guardian_email} onChange={e => set('guardian_email', e.target.value)} />
              </div>
              <div>
                <label className="label">Occupation</label>
                <input className="input" value={form.guardian_occupation} onChange={e => set('guardian_occupation', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Student</>}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>

        </form>
      </div>
    </>
  )
}
