'use client'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  Camera, CheckCircle, Loader2, Search,
  Shield, XCircle, Check, Mail, UserCheck,
} from 'lucide-react'

interface StaffUser {
  id:              number
  name:            string
  email:           string
  role:            string
  face_registered: boolean
}

export default function FaceRegistrationPage() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [staffList,    setStaffList]    = useState<StaffUser[]>([])
  const [search,       setSearch]       = useState('')
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null)
  const [cameraOpen,   setCameraOpen]   = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/teacher-attendance/today')
      setStaffList(res.data.staff.map((s: any) => ({
        id: s.user_id, name: s.name, email: s.email,
        role: s.role, face_registered: s.face_registered,
      })))
    } catch { toast.error('Failed to load staff') }
    finally { setLoading(false) }
  }

  const openCamera = async (user: StaffUser) => {
    setSelectedUser(user)
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      toast.error('Camera access denied')
      setCameraOpen(false)
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOpen(false)
    setSelectedUser(null)
  }

  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedUser) return
    setUploading(true)

    try {
      // Capture frame
      const video  = videoRef.current
      const canvas = canvasRef.current
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)

      // Convert to blob
      const blob: Blob = await new Promise(r =>
        canvas.toBlob(b => r(b!), 'image/jpeg', 0.95)
      )
      const photoFile = new File([blob], 'face.jpg', { type: 'image/jpeg' })

      // Send photo to backend — DeepFace extracts embedding on server
      const formData = new FormData()
      formData.append('photo', photoFile)

      await api.post(
        `/teacher-attendance/register-face/${selectedUser.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      )

      toast.success(`✅ Face registered for ${selectedUser.name}!`)

      // Update list
      setStaffList(prev => prev.map(s =>
        s.id === selectedUser.id ? { ...s, face_registered: true } : s
      ))
      closeCamera()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed. Ensure clear face photo.')
    } finally {
      setUploading(false)
    }
  }

  const filtered  = staffList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  )
  const roleLabel = (r: string) => r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const registered = staffList.filter(s => s.face_registered).length

  return (
    <>
      <Navbar title="Face Registration" />
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="card !p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">Face Registration — DeepFace AI</h2>
            <p className="text-sm text-gray-500">
              Take a clear photo of each teacher. Backend extracts the face embedding automatically.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-blue-600">{registered}/{staffList.length}</p>
            <p className="text-xs text-gray-400">Registered</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: staffList.length ? `${(registered / staffList.length) * 100}%` : '0%' }}
          />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">📸 How to get best results:</p>
          <p>• Ensure bright, even lighting on the face</p>
          <p>• Teacher looks directly at camera</p>
          <p>• Remove glasses/hat if possible</p>
          <p>• DeepFace (Facenet model) processes the photo on the server</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, email or role..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(staff => (
              <div key={staff.id} className="card !p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0
                  ${staff.face_registered ? 'bg-green-500' : 'bg-slate-400'}`}>
                  {staff.face_registered ? <Check className="w-6 h-6" /> : staff.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{staff.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {roleLabel(staff.role)}
                    </span>
                    {staff.face_registered && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {staff.email}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => openCamera(staff)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    ${staff.face_registered
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <Camera className="w-4 h-4" />
                  {staff.face_registered ? 'Re-register' : 'Register Face'}
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">No staff found</div>
            )}
          </div>
        )}

        {/* Camera Modal */}
        {cameraOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedUser.name}</p>
                  <p className="text-blue-200 text-xs">{roleLabel(selectedUser.role)}</p>
                </div>
                <button onClick={closeCamera} className="p-2 bg-white/20 rounded-xl hover:bg-white/30">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Camera */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                  <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Face oval */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-52 border-4 border-white/80 rounded-full"
                      style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
                  </div>
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                      Position face in oval · Good lighting
                    </span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Processing notice */}
                {uploading && (
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    DeepFace extracting face embedding on server... (may take 20–30s first time)
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={closeCamera} disabled={uploading} className="flex-1 btn-secondary justify-center">
                    Cancel
                  </button>
                  <button onClick={captureAndRegister} disabled={uploading} className="flex-1 btn-primary justify-center">
                    {uploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      : <><Camera className="w-4 h-4" /> Capture & Register</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
