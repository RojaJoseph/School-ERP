'use client'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import api from '@/lib/api'
import { Student } from '@/types'
import { toast } from 'react-toastify'
import { Modal, Pagination, ConfirmDialog } from '@/components/ui'
import { useDebounce, usePagination } from '@/hooks'
import {
  UserPlus, Search, Eye, Pencil, Trash2, Loader2,
  Upload, Download, FileText, CheckCircle, XCircle,
  AlertCircle, X,
} from 'lucide-react'

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12']
const CSV_TEMPLATE = `admission_no,first_name,last_name,date_of_birth,gender,class_name,section,academic_year,roll_no,email,phone,address,city,state,blood_group,guardian_name,guardian_phone,guardian_email
ADM001,John,Doe,2010-05-15,male,5,A,2024-25,1,john@email.com,9876543210,123 Main St,Chennai,Tamil Nadu,O+,Robert Doe,9876543211,robert@email.com`

interface ImportResult {
  row: number
  status: 'success' | 'error' | 'skipped'
  message: string
}

export default function StudentsPage() {
  const [students, setStudents]   = useState<Student[]>([])
  const [total,    setTotal]      = useState(0)
  const [loading,  setLoading]    = useState(false)
  const [search,   setSearch]     = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [deleting, setDeleting]   = useState(false)

  // Import state
  const importRef               = useRef<HTMLInputElement>(null)
  const [showImport, setShowImport]   = useState(false)
  const [importing,  setImporting]    = useState(false)
  const [importRes,  setImportRes]    = useState<{ total: number; success: number; failed: number; results: ImportResult[] } | null>(null)

  const debouncedSearch = useDebounce(search, 400)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage, is_active: true }
      if (debouncedSearch) params.search     = debouncedSearch
      if (classFilter)     params.class_name = classFilter
      const res = await api.get('/students', { params })
      setStudents(res.data.students)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [page, debouncedSearch, classFilter])

  const handleDeactivate = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.patch(`/students/${deleteId}/deactivate`)
      toast.success('Student deactivated')
      setDeleteId(null)
      fetchStudents()
    } catch {
      toast.error('Failed to deactivate')
    } finally {
      setDeleting(false)
    }
  }

  // ── CSV Import ──────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportRes(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/students/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportRes(res.data)
      if (res.data.success > 0) {
        toast.success(`✅ Imported ${res.data.success} students successfully`)
        fetchStudents()
      }
      if (res.data.failed > 0) {
        toast.warning(`⚠️ ${res.data.failed} rows had errors`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'student_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Export to CSV ───────────────────────────────────
  const exportCSV = () => {
    if (!students.length) { toast.info('No data to export'); return }
    const headers = ['Admission No','Name','Class','Section','Gender','DOB','Email','Phone','Guardian','Guardian Phone','Status']
    const rows = students.map(s => [
      s.admission_no,
      `${s.first_name} ${s.last_name}`,
      s.class_name, s.section || '',
      s.gender, s.date_of_birth,
      s.email || '', s.phone || '',
      s.guardian_name, s.guardian_phone,
      s.is_active ? 'Active' : 'Inactive',
    ])
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `students_export_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported successfully')
  }

  return (
    <>
      <Navbar title="Student Management" />
      <div className="p-4 lg:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Students</h2>
            <p className="text-sm text-gray-500">{total} students enrolled</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={exportCSV} className="btn-secondary">
              <Download className="w-4 h-4" /> Export
            </button>
            <Link href="/students/add" className="btn-primary">
              <UserPlus className="w-4 h-4" /> Add Student
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card !p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, admission no..."
              value={search}
              onChange={e => { setSearch(e.target.value); reset() }}
            />
          </div>
          <select className="input sm:w-44" value={classFilter} onChange={e => { setClassFilter(e.target.value); reset() }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Admission No','Student Name','Class','Guardian','Phone','Status','Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                    No students found. Try adjusting the filters.
                  </td></tr>
                ) : students.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-mono text-blue-600 font-medium">{s.admission_no}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center
                                        text-blue-700 font-bold text-xs shrink-0">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-gray-400">{s.email || s.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-blue">Class {s.class_name}{s.section ? `-${s.section}` : ''}</span>
                    </td>
                    <td className="table-cell text-gray-700">{s.guardian_name}</td>
                    <td className="table-cell text-gray-500">{s.guardian_phone}</td>
                    <td className="table-cell">
                      <span className={s.is_active ? 'badge-green' : 'badge-red'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link href={`/students/${s.id}`} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/students/${s.id}`} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Deactivate">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Import CSV Modal ── */}
      <Modal
        open={showImport}
        onClose={() => { setShowImport(false); setImportRes(null) }}
        title="Import Students via CSV"
        size="lg"
        footer={
          <button onClick={() => { setShowImport(false); setImportRes(null) }} className="btn-secondary">Close</button>
        }
      >
        <div className="space-y-5">
          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
            <p className="font-semibold">📋 Instructions</p>
            <p>1. Download the template CSV file</p>
            <p>2. Fill in student data (first 3 columns + admission_no are required)</p>
            <p>3. Save as CSV and upload below</p>
            <p className="text-blue-500">Duplicate admission numbers will be skipped automatically.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={downloadTemplate} className="btn-secondary flex-1">
              <Download className="w-4 h-4" /> Download Template
            </button>
            <button
              onClick={() => importRef.current?.click()}
              disabled={importing}
              className="btn-primary flex-1"
            >
              {importing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                : <><Upload className="w-4 h-4" /> Upload CSV</>}
            </button>
          </div>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />

          {/* Results */}
          {importRes && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-green-600">{importRes.success}</p>
                  <p className="text-xs text-green-500">Imported</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-red-500">{importRes.failed}</p>
                  <p className="text-xs text-red-400">Failed</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-gray-600">{importRes.total}</p>
                  <p className="text-xs text-gray-400">Total Rows</p>
                </div>
              </div>

              {/* Row-level results */}
              <div className="max-h-48 overflow-y-auto border rounded-xl divide-y text-sm">
                {importRes.results.map(r => (
                  <div key={r.row} className={`flex items-start gap-2 px-3 py-2
                    ${r.status === 'success' ? 'bg-green-50' : r.status === 'error' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    {r.status === 'success'
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      : r.status === 'error'
                      ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                    <span className="text-gray-600"><span className="font-medium">Row {r.row}:</span> {r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeactivate}
        loading={deleting}
        title="Deactivate Student?"
        message="This student will be marked inactive and hidden from active lists. You can reactivate them later."
        confirmLabel="Deactivate"
        variant="warning"
      />
    </>
  )
}
