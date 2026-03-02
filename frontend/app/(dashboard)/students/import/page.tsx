'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  Upload, ArrowLeft, Download, CheckCircle, XCircle,
  AlertCircle, Loader2, FileSpreadsheet, Users,
} from 'lucide-react'

interface ImportRow {
  row: number
  status: 'success' | 'error' | 'skipped'
  message: string
  data?: any
}

const REQUIRED_COLUMNS = [
  'first_name','last_name','date_of_birth','gender',
  'class_name','academic_year','guardian_name','guardian_phone',
]
const OPTIONAL_COLUMNS = [
  'admission_no','roll_no','section','email','phone','address',
  'city','state','blood_group','guardian_email',
]

const SAMPLE_CSV = [
  [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(','),
  'John,Doe,2010-06-15,male,10,2024-25,Robert Doe,9876543210,ADM001,1,A,john@example.com,9876543211,123 Main St,Chennai,Tamil Nadu,O+,robert@example.com',
  'Jane,Smith,2011-03-22,female,9,2024-25,Mary Smith,9876543220,ADM002,2,B,,,456 Park Ave,Coimbatore,Tamil Nadu,B+,',
].join('\n')

export default function ImportStudentsPage() {
  const router = useRouter()
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<any[]>([])
  const [results,  setResults]  = useState<ImportRow[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors,   setErrors]   = useState<string[]>([])

  const parseCSV = useCallback(async (f: File) => {
    const Papa = (await import('papaparse')).default
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: r => resolve(r.data as any[]),
        error:   e => reject(e),
      })
    })
  }, [])

  const validateRow = (row: any, idx: number): string[] => {
    const errs: string[] = []
    REQUIRED_COLUMNS.forEach(col => {
      if (!row[col]) errs.push(`Row ${idx + 2}: '${col}' is required`)
    })
    if (row.gender && !['male','female','other'].includes(row.gender))
      errs.push(`Row ${idx + 2}: 'gender' must be male/female/other`)
    if (row.date_of_birth && isNaN(Date.parse(row.date_of_birth)))
      errs.push(`Row ${idx + 2}: 'date_of_birth' must be YYYY-MM-DD`)
    return errs
  }

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return }
    setFile(f)
    setResults(null)
    setErrors([])
    try {
      const data = await parseCSV(f)
      // Validate columns
      const missing = REQUIRED_COLUMNS.filter(c => !Object.keys(data[0] || {}).includes(c))
      if (missing.length) {
        setErrors([`Missing required columns: ${missing.join(', ')}`])
        setPreview([])
        return
      }
      // Validate rows
      const allErrors: string[] = []
      data.slice(0, 100).forEach((row, i) => allErrors.push(...validateRow(row, i)))
      setErrors(allErrors.slice(0, 10))
      setPreview(data.slice(0, 5))
    } catch {
      toast.error('Failed to parse CSV')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const data = await parseCSV(file)
      const fd   = new FormData()
      fd.append('file', file)
      const res = await api.post('/students/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResults(res.data.results)
      const success = res.data.results.filter((r: ImportRow) => r.status === 'success').length
      toast.success(`Imported ${success} students successfully!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'students_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = results?.filter(r => r.status === 'success').length ?? 0
  const errorCount   = results?.filter(r => r.status === 'error').length   ?? 0

  return (
    <>
      <Navbar title="Import Students" />
      <div className="p-6 space-y-5 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/students')} className="btn-secondary !py-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={downloadSample} className="btn-secondary">
            <Download className="w-4 h-4" /> Download Template
          </button>
        </div>

        {/* Info */}
        <div className="card bg-blue-50 !border-blue-200">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-4 h-4" /> CSV Import Instructions
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Required columns:</strong> {REQUIRED_COLUMNS.join(', ')}</p>
            <p><strong>Optional columns:</strong> {OPTIONAL_COLUMNS.join(', ')}</p>
            <p><strong>Date format:</strong> YYYY-MM-DD (e.g. 2010-06-15)</p>
            <p><strong>Gender values:</strong> male / female / other</p>
            <p><strong>Max rows per import:</strong> 500</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById('csv-file-input')?.click()}
          className={`card border-2 border-dashed cursor-pointer transition-all text-center py-12
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-gray-300'}`} />
          <p className="font-medium text-gray-700">Drop your CSV file here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          {file && <p className="mt-3 text-sm text-blue-600 font-medium">✓ {file.name}</p>}
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f) }}
          />
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="card bg-red-50 !border-red-200">
            <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" /> Validation Errors</h4>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
            {errors.length === 10 && <p className="text-xs text-red-400 mt-2">Showing first 10 errors...</p>}
          </div>
        )}

        {/* Preview Table */}
        {preview.length > 0 && errors.length === 0 && (
          <div className="card !p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Preview (first 5 rows)</h3>
              <button
                onClick={handleImport}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Users className="w-4 h-4" /> Import All Rows</>}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {REQUIRED_COLUMNS.map(c => <th key={c} className="table-header">{c}</th>)}
                    <th className="table-header">section</th>
                    <th className="table-header">blood_group</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="table-row">
                      {REQUIRED_COLUMNS.map(c => <td key={c} className="table-cell">{row[c] || '—'}</td>)}
                      <td className="table-cell">{row.section || '—'}</td>
                      <td className="table-cell">{row.blood_group || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Results */}
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="card bg-green-50 text-center">
                <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-green-500">Imported</p>
              </div>
              <div className="card bg-red-50 text-center">
                <XCircle className="w-7 h-7 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                <p className="text-sm text-red-400">Failed</p>
              </div>
              <div className="card bg-gray-50 text-center">
                <FileSpreadsheet className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-600">{results.length}</p>
                <p className="text-sm text-gray-400">Total Rows</p>
              </div>
            </div>

            {errorCount > 0 && (
              <div className="card !p-0 overflow-hidden">
                <div className="px-4 py-3 border-b bg-red-50">
                  <h4 className="font-semibold text-red-700">Failed Rows</h4>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {results.filter(r => r.status === 'error').map((r, i) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-3 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-gray-500">Row {r.row}:</span>
                      <span className="text-red-600">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => router.push('/students')} className="btn-primary">
              <Users className="w-4 h-4" /> View Students
            </button>
          </div>
        )}

      </div>
    </>
  )
}
