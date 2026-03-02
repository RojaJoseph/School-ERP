'use client'
import { useEffect, useState } from 'react'
import PortalPage from '@/components/portal/PortalPage'
import portalApi from '@/lib/portalApi'
import { User, Phone, Mail, MapPin, Heart, BookOpen, Users } from 'lucide-react'

export default function ChildInfoPage() {
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    portalApi.get('/portal/me').then(r => setInfo(r.data)).catch(() => {})
  }, [])

  if (!info) return <PortalPage title="Child Info"><div className="text-center py-12 text-gray-400">Loading...</div></PortalPage>

  const rows = [
    { icon: User,     label: 'Full Name',        value: info.full_name },
    { icon: BookOpen, label: 'Class',             value: `Class ${info.class_name} - ${info.section}` },
    { icon: BookOpen, label: 'Admission No',      value: info.admission_no },
    { icon: BookOpen, label: 'Roll No',           value: info.roll_no },
    { icon: User,     label: 'Date of Birth',     value: info.date_of_birth },
    { icon: User,     label: 'Gender',            value: info.gender },
    { icon: Heart,    label: 'Blood Group',       value: info.blood_group || '—' },
    { icon: Mail,     label: 'Email',             value: info.email || '—' },
    { icon: Phone,    label: 'Phone',             value: info.phone || '—' },
    { icon: MapPin,   label: 'Address',           value: info.address || '—' },
    { icon: Users,    label: 'Guardian',          value: info.guardian_name },
    { icon: Phone,    label: 'Guardian Phone',    value: info.guardian_phone },
    { icon: Mail,     label: 'Guardian Email',    value: info.guardian_email || '—' },
    { icon: Users,    label: 'Guardian Relation', value: info.guardian_relation || '—' },
  ]

  return (
    <PortalPage title="Child Info">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-3">
          {info.full_name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{info.full_name}</h2>
        <p className="text-gray-500 text-sm">Class {info.class_name} • {info.academic_year}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {rows.map((row, i) => {
          const Icon = row.icon
          return (
            <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${i < rows.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{row.label}</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{row.value}</p>
              </div>
            </div>
          )
        })}
      </div>
    </PortalPage>
  )
}
