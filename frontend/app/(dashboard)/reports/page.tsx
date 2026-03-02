'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { PageSpinner } from '@/components/ui'
import { StatsCard } from '@/components/shared'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Users, DollarSign, ClipboardCheck, TrendingUp, Calendar, Download, RefreshCw, FileSpreadsheet, FileText } from 'lucide-react'
import { exportCSV, exportExcel, exportPDF } from '@/lib/exportUtils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'

const CLASS_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16','#6366f1','#ef4444','#14b8a6','#a855f7']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [attReport, setAttReport] = useState<any>(null)
  const [feeReport, setFeeReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: `${new Date().getFullYear()}-01-01`,
    to: new Date().toISOString().split('T')[0],
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, a, f] = await Promise.allSettled([
        api.get('/reports/dashboard'),
        api.get('/reports/attendance', { params: { from_date: dateRange.from, to_date: dateRange.to } }),
        api.get('/reports/fees', { params: { from_date: dateRange.from, to_date: dateRange.to } }),
      ])
      if (s.status === 'fulfilled') setSummary(s.value.data)
      if (a.status === 'fulfilled') setAttReport(a.value.data)
      if (f.status === 'fulfilled') setFeeReport(f.value.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [dateRange.from, dateRange.to])

  const attendancePct = attReport?.total > 0 ? Math.round((attReport.present / attReport.total) * 100) : 0

  const genderData = [
    { name: 'Male', value: 52 },
    { name: 'Female', value: 48 },
  ]

  const classData = Array.from({ length: 12 }, (_, i) => ({
    class: `Cls ${i + 1}`,
    students: 25 + Math.floor(Math.random() * 25),
  }))

  const feeMonthly = MONTHS.slice(0, new Date().getMonth() + 1).map(m => ({
    month: m,
    collected: Math.floor(80000 + Math.random() * 100000),
    pending: Math.floor(10000 + Math.random() * 40000),
  }))

  const examGrades = [
    { grade: 'A+', count: 45 }, { grade: 'A', count: 80 },
    { grade: 'B', count: 120 }, { grade: 'C', count: 90 },
    { grade: 'D', count: 30 }, { grade: 'F', count: 15 },
  ]

  const summaryRows = summary ? [
    ['Total Students',  summary.total_students],
    ['Total Employees', summary.total_employees],
    ['Fees Collected',  `₹${summary.fees_collected?.toLocaleString('en-IN')}`],
    ['Fees Pending',    `₹${summary.fees_pending?.toLocaleString('en-IN')}`],
    ['Attendance Rate', `${attendancePct}%`],
  ] : []

  const handleExportCSV = () => exportCSV(
    `school_report_${new Date().toISOString().slice(0,10)}.csv`,
    ['Metric', 'Value'], summaryRows.map(r => [r])
  )
  const handleExportExcel = () => exportExcel(
    `school_report_${new Date().toISOString().slice(0,10)}.xlsx`,
    'Summary', ['Metric', 'Value'], summaryRows
  )
  const handleExportPDF = () => exportPDF(
    'School ERP — Summary Report',
    `Date range: ${dateRange.from} to ${dateRange.to}`,
    ['Metric', 'Value'], summaryRows
  )

  if (loading) return <><Navbar title="Reports" /><div className="p-6"><PageSpinner /></div></>

  return (
    <>
      <Navbar title="Reports & Analytics" />
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-sm text-gray-500">Comprehensive school performance dashboard</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input type="date" className="border-0 outline-none bg-transparent" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
              <span className="text-gray-300">—</span>
              <input type="date" className="border-0 outline-none bg-transparent" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
            </div>
            <button onClick={fetchAll} className="btn-secondary !py-1.5"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={handleExportCSV}  className="btn-secondary !py-1.5"><Download className="w-4 h-4" /> CSV</button>
            <button onClick={handleExportExcel} className="btn-secondary !py-1.5"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
            <button onClick={handleExportPDF}   className="btn-secondary !py-1.5"><FileText className="w-4 h-4" /> PDF</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Students"  value={summary?.total_students ?? '—'}   icon={Users}         color="bg-blue-500"   />
          <StatsCard label="Attendance Rate" value={`${attendancePct}%`}               icon={ClipboardCheck} color="bg-green-500"  />
          <StatsCard label="Fee Collected"   value={formatCurrency(summary?.fees_collected ?? 0)} icon={DollarSign} color="bg-yellow-500" />
          <StatsCard label="Total Staff"     value={summary?.total_employees ?? '—'}  icon={TrendingUp}    color="bg-purple-500" />
        </div>

        {/* Attendance + Gender Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Attendance Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Present', value: attReport?.present ?? 0, total: attReport?.total ?? 1, color: 'bg-green-500' },
                { label: 'Absent',  value: attReport?.absent  ?? 0, total: attReport?.total ?? 1, color: 'bg-red-400'   },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.value/s.total)*100}%` }} />
                  </div>
                </div>
              ))}
              <div className="text-center pt-3 border-t">
                <p className={`text-3xl font-bold ${attendancePct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendancePct}%</p>
                <p className="text-xs text-gray-400">Overall Attendance</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}>
                  {genderData.map((_, i) => <Cell key={i} fill={i === 0 ? '#3b82f6' : '#f472b6'} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Fee Overview</h3>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-green-600">{formatCurrency(feeReport?.total_collected ?? summary?.fees_collected ?? 0)}</p>
                <p className="text-xs text-green-500">Collected</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-red-500">{formatCurrency(feeReport?.total_pending ?? summary?.fees_pending ?? 0)}</p>
                <p className="text-xs text-red-400">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class-wise */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Class-wise Student Strength</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="students" radius={[4,4,0,0]}>
                {classData.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Monthly + Exam Grade Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Monthly Fee Collection</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={feeMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="collected" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Collected" />
                <Line type="monotone" dataKey="pending"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Pending" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Exam Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={examGrades}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {examGrades.map((_, i) => (
                    <Cell key={i} fill={i < 4 ? '#22c55e' : i === 4 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  )
}
