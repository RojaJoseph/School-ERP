'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  Camera, CheckCircle, XCircle, Loader2,
  MapPin, Shield, AlertTriangle, RefreshCw, BarChart3, Clock,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

type Step = 'init' | 'gps' | 'gps-checking' | 'gps-error' | 'camera' | 'uploading' | 'success' | 'error' | 'no-face'

export default function TeacherAttendancePage() {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step,        setStep]       = useState<Step>('init')
  const [gpsData,     setGpsData]    = useState<GeolocationCoordinates | null>(null)
  const [gpsError,    setGpsError]   = useState('')
  const [result,      setResult]     = useState<any>(null)
  const [errorMsg,    setErrorMsg]   = useState('')
  const [todayStatus, setTodayStatus]= useState<any>(null)
  const [config,      setConfig]     = useState<any>(null)

  useEffect(() => {
    fetchStatus()
    fetchConfig()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await api.get('/teacher-attendance/my-status')
      setTodayStatus(res.data)
      if (res.data.marked_today) setStep('success')
      else setStep('gps')
    } catch { setStep('gps') }
  }

  const fetchConfig = async () => {
    try {
      const res = await api.get('/teacher-attendance/config')
      setConfig(res.data)
    } catch {}
  }

  // ── Step 1: Request GPS ───────────────────────────
  const requestGPS = () => {
    setGpsError('')
    setStep('gps-checking')
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.')
      setStep('gps-error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { accuracy } = pos.coords
        if (accuracy > 30) {
          setGpsError(`GPS accuracy too low (${accuracy.toFixed(0)}m). Move to open area and retry.`)
          setStep('gps-error')
          return
        }
        setGpsData(pos.coords)
        openCamera()
      },
      () => {
        setGpsError('Location access denied. Please allow location permission and retry.')
        setStep('gps-error')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // ── Step 2: Open Camera ───────────────────────────
  const openCamera = async () => {
    setStep('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permission.')
      setStep('error')
    }
  }

  // ── Step 3: Capture selfie → send to backend ──────
  const captureAndSubmit = async () => {
    if (!videoRef.current || !canvasRef.current || !gpsData) return
    setStep('uploading')

    try {
      // Capture frame from video
      const video  = videoRef.current
      const canvas = canvasRef.current
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)

      // Stop camera
      streamRef.current?.getTracks().forEach(t => t.stop())

      // Convert to blob
      const blob: Blob = await new Promise(res =>
        canvas.toBlob(b => res(b!), 'image/jpeg', 0.92)
      )
      const selfieFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })

      // Build form data — backend (DeepFace) does all face processing
      const formData = new FormData()
      formData.append('selfie',       selfieFile)
      formData.append('latitude',     String(gpsData.latitude))
      formData.append('longitude',    String(gpsData.longitude))
      formData.append('gps_accuracy', String(gpsData.accuracy))
      formData.append('check_time',   new Date().toTimeString().slice(0, 5))

      // Send to backend — DeepFace extracts + compares face
      const res = await api.post('/teacher-attendance/mark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,  // DeepFace needs up to 30s on first run
      })

      setResult(res.data)
      setStep('success')
      fetchStatus()

    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Verification failed. Please try again.'
      if (msg.includes('not registered')) {
        setStep('no-face')
      } else {
        setErrorMsg(msg)
        setStep('error')
      }
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }

  const retry = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setGpsData(null)
    setErrorMsg('')
    setStep('gps')
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <>
      <Navbar title="Mark Attendance" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Config Bar */}
        {config && (
          <div className="card !p-3 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-green-500" />On time before {config.ontime_before}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-yellow-500" />Late until {config.late_before}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-blue-500" />Within {config.radius_meters}m of school</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-purple-500" />DeepFace AI Verification</span>
          </div>
        )}

        {/* ── INIT ── */}
        {step === 'init' && (
          <div className="card text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-500">Checking status...</p>
          </div>
        )}

        {/* ── GPS REQUEST ── */}
        {step === 'gps' && (
          <div className="card text-center py-12">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MapPin className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Step 1: Verify Location</h2>
            <p className="text-sm text-gray-500 mb-1">We need to confirm you're at school</p>
            <p className="text-xs text-gray-400 mb-8">Must be within {config?.radius_meters || 100}m · Accuracy must be under 30m</p>
            <button onClick={requestGPS} className="btn-primary mx-auto px-8 py-3 text-base">
              <MapPin className="w-5 h-5" /> Allow Location
            </button>
          </div>
        )}

        {/* ── GPS CHECKING ── */}
        {step === 'gps-checking' && (
          <div className="card text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">Getting your location...</p>
            <p className="text-sm text-gray-400 mt-1">Please wait, this may take a few seconds</p>
          </div>
        )}

        {/* ── GPS ERROR ── */}
        {step === 'gps-error' && (
          <div className="card text-center py-10">
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Location Error</h2>
            <p className="text-sm text-gray-500 mb-6">{gpsError}</p>
            <button onClick={() => setStep('gps')} className="btn-primary mx-auto">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {/* ── CAMERA ── */}
        {step === 'camera' && (
          <div className="card !p-4">
            {/* GPS confirmed */}
            {gpsData && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4 text-xs text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  ✅ Location verified — Accuracy: {gpsData.accuracy.toFixed(0)}m
                </span>
              </div>
            )}

            <h2 className="font-bold text-gray-800 mb-1">Step 2: Take a Selfie</h2>
            <p className="text-xs text-gray-500 mb-4">
              Look directly at camera · Good lighting · No glasses/hat if possible
            </p>

            {/* Camera feed */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] mb-4">
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Oval face guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-44 h-52 border-4 border-white/80 rounded-full"
                  style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
                />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                  Align your face in the oval
                </span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <button onClick={captureAndSubmit}
              className="w-full btn-primary justify-center py-3 text-base rounded-xl">
              <Camera className="w-5 h-5" /> Capture & Verify
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              🤖 DeepFace AI will verify your identity on the server
            </p>
          </div>
        )}

        {/* ── UPLOADING / PROCESSING ── */}
        {step === 'uploading' && (
          <div className="card text-center py-14">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Loader2 className="w-24 h-24 animate-spin text-blue-100" />
              <Shield className="w-10 h-10 text-blue-600 absolute inset-0 m-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Verifying Identity...</h2>
            <div className="space-y-1.5 text-sm text-gray-500">
              <p>📍 Distance validated</p>
              <p>🤖 DeepFace extracting face embedding...</p>
              <p>🔍 Comparing with registered profile...</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">This may take 10–30 seconds on first run</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="card text-center py-10">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5
              ${(result?.status || todayStatus?.status) === 'late' ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <CheckCircle className={`w-14 h-14
                ${(result?.status || todayStatus?.status) === 'late' ? 'text-yellow-500' : 'text-green-500'}`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {(result?.status || todayStatus?.status) === 'late' ? '⚠️ Marked Late' : '✅ Attendance Marked!'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {result?.message || `Already marked as ${todayStatus?.status?.toUpperCase()} today`}
            </p>

            <div className="grid grid-cols-2 gap-3 text-left mb-6">
              {[
                { label: 'Status',      value: (result?.status || todayStatus?.status || '').toUpperCase() },
                { label: 'Check-in',    value: result?.check_in_time || todayStatus?.check_in_time || '—' },
                { label: 'Distance',    value: `${(result?.distance_meters || todayStatus?.distance_meters || 0).toFixed(0)}m from school` },
                { label: 'AI Match',    value: result?.face_similarity != null
                    ? `${result.face_similarity}%`
                    : todayStatus?.face_similarity != null
                    ? `${todayStatus.face_similarity}%`
                    : '—'
                },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="font-bold text-sm text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => router.push('/teacher-attendance/my-report')} className="btn-primary justify-center">
                <BarChart3 className="w-4 h-4" /> View My Monthly Report
              </button>
              <button onClick={() => router.push('/dashboard')} className="btn-secondary justify-center">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── NO FACE REGISTERED ── */}
        {step === 'no-face' && (
          <div className="card text-center py-12">
            <AlertTriangle className="w-14 h-14 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Face Not Registered</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your face hasn't been registered in the system yet.<br />
              Please contact the admin to register your face.
            </p>
            <button onClick={() => router.push('/teacher-attendance/admin')} className="btn-primary mx-auto">
              <Shield className="w-4 h-4" /> Go to Registration
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="card text-center py-10">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
            <button onClick={retry} className="btn-primary mx-auto">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

      </div>
    </>
  )
}
