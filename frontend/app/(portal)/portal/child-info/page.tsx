'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PortalPage from '../PortalPage'
import api from '@/lib/api'
import { User, Phone, Mail, MapPin, Heart, BookOpen, Calendar } from 'lucide-react'

export default function ChildInfoPage() {
  const params = useSearchParams()
  const id = params.get('id')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (id) api.get(`/portal/student/${id}`).then(r => setData(r.data)).catch(() => {})
  }, [id])

  const InfoRow = ({ icon: Icon, label, value }: any) => value ? (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  ) : null

  return (
    <PortalPage title="Child Info">
      {!data ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
              {data.name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold">{data.name}</h2>
            <p className="text-indigo-200 text-sm mt-1">Class {data.class_name} - {data.section}</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/10 rounded-xl p-2">
                <p className="text-lg font-bold">{data.attendance_percentage}%</p>
                <p className="text-xs text-indigo-200">Attendance</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <p className="text-lg font-bold">{data.admission_no}</p>
                <p className="text-xs text-indigo-200">Adm No</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <p className="text-lg font-bold">{data.roll_no || '—'}</p>
                <p className="text-xs text-indigo-200">Roll No</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">Personal Information</h3>
            <InfoRow icon={Calendar} label="Date of Birth" value={data.date_of_birth} />
            <InfoRow icon={User} label="Gender" value={data.gender} />
            <InfoRow icon={Heart} label="Blood Group" value={data.blood_group} />
            <InfoRow icon={BookOpen} label="Academic Year" value={data.academic_year} />
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">Contact Details</h3>
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow icon={Phone} label="Phone" value={data.phone} />
            <InfoRow icon={MapPin} label="Address" value={[data.address, data.city, data.state].filter(Boolean).join(', ')} />
          </div>

          {/* Guardian */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">Guardian Information</h3>
            <InfoRow icon={User} label="Guardian Name" value={data.guardian_name} />
            <InfoRow icon={User} label="Relation" value={data.guardian_relation} />
            <InfoRow icon={Phone} label="Guardian Phone" value={data.guardian_phone} />
            <InfoRow icon={Mail} label="Guardian Email" value={data.guardian_email} />
          </div>
        </div>
      )}
    </PortalPage>
  )
}
