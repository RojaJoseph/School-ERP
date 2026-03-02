'use client'
import { createContext, useContext, useState, useEffect } from 'react'

interface StudentSession {
  student_id:   number
  full_name:    string
  class_name:   string
  section:      string
  academic_year:string
  admission_no: string
  roll_no:      string
  photo?:       string
  guardian_name:string
}

interface PortalContextType {
  student:     StudentSession | null
  setStudent:  (s: StudentSession | null) => void
  logout:      () => void
}

const PortalContext = createContext<PortalContextType>({
  student: null, setStudent: () => {}, logout: () => {},
})

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudentState] = useState<StudentSession | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('portal_student')
    if (stored) setStudentState(JSON.parse(stored))
  }, [])

  const setStudent = (s: StudentSession | null) => {
    if (s) localStorage.setItem('portal_student', JSON.stringify(s))
    else   localStorage.removeItem('portal_student')
    setStudentState(s)
  }

  const logout = () => {
    localStorage.removeItem('portal_student')
    setStudentState(null)
    window.location.href = '/portal'
  }

  return (
    <PortalContext.Provider value={{ student, setStudent, logout }}>
      {children}
    </PortalContext.Provider>
  )
}

export const usePortal = () => useContext(PortalContext)
