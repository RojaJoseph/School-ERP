/**
 * Export utilities — PDF and Excel generation for School ERP
 * Uses jsPDF + autoTable for PDF, xlsx for Excel
 */

// ── PDF Export ──────────────────────────────────────────────────────
export async function exportTableToPDF(options: {
  title: string
  subtitle?: string
  columns: string[]
  rows: (string | number)[][]
  filename?: string
}) {
  const { jsPDF }   = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(30, 64, 175)
  doc.text(options.title, 14, 18)

  if (options.subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(options.subtitle, 14, 26)
  }

  // Date stamp
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, options.subtitle ? 33 : 26)

  // Table
  autoTable(doc, {
    head: [options.columns],
    body: options.rows,
    startY: options.subtitle ? 38 : 31,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  doc.save(options.filename || `${options.title.replace(/\s+/g,'_')}_${Date.now()}.pdf`)
}

// ── Fee Receipt PDF ─────────────────────────────────────────────────
export async function exportFeeReceiptPDF(payment: {
  invoice_no: string
  student_name: string
  class_name: string
  amount: number
  paid_amount: number
  payment_method: string
  status: string
  due_date?: string
  paid_at?: string
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: [105, 148] }) // A6 receipt

  const primary   = [30, 64, 175]  as [number,number,number]
  const lightGray = [248, 250, 252] as [number,number,number]

  // Header band
  doc.setFillColor(...primary)
  doc.rect(0, 0, 105, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('School ERP', 8, 11)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Fee Payment Receipt', 8, 18)
  doc.text(`Invoice: ${payment.invoice_no}`, 8, 24)

  // Body
  doc.setTextColor(30, 30, 30)
  const row = (label: string, value: string, y: number) => {
    doc.setFillColor(...lightGray)
    doc.rect(6, y - 4, 93, 7, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(label, 9, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, y)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n)

  row('Student',        payment.student_name,        36)
  row('Class',          payment.class_name,           45)
  row('Amount Due',     fmt(payment.amount),          54)
  row('Amount Paid',    fmt(payment.paid_amount),     63)
  row('Payment Method', payment.payment_method || '—', 72)
  row('Status',         payment.status.toUpperCase(), 81)
  row('Paid Date',      payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN') : '—', 90)

  // Status stamp
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(payment.status === 'paid' ? 22 : 220, payment.status === 'paid' ? 163 : 38, payment.status === 'paid' ? 74 : 38)
  doc.setGState(doc.GState({ opacity: 0.15 }))
  doc.text(payment.status.toUpperCase(), 20, 130, { angle: 30 })
  doc.setGState(doc.GState({ opacity: 1 }))

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for your payment. This is a computer-generated receipt.', 8, 142)

  doc.save(`receipt_${payment.invoice_no}.pdf`)
}

// ── Excel Export ────────────────────────────────────────────────────
export async function exportToExcel(options: {
  title: string
  columns: { header: string; key: string; width?: number }[]
  data: Record<string, any>[]
  filename?: string
  sheetName?: string
}) {
  const XLSX = await import('xlsx')

  const ws_data = [
    options.columns.map(c => c.header),
    ...options.data.map(row => options.columns.map(c => row[c.key] ?? ''))
  ]

  const ws = XLSX.utils.aoa_to_sheet(ws_data)

  // Column widths
  ws['!cols'] = options.columns.map(c => ({ wch: c.width || 18 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || options.title.slice(0,31))

  XLSX.writeFile(wb, options.filename || `${options.title.replace(/\s+/g,'_')}_${Date.now()}.xlsx`)
}

// ── Student List Export helpers ─────────────────────────────────────
export const STUDENT_COLUMNS_PDF   = ['Adm No','Name','Class','Section','Guardian','Phone','Status']
export const STUDENT_COLUMNS_EXCEL = [
  { header: 'Admission No', key: 'admission_no', width: 16 },
  { header: 'First Name',   key: 'first_name',   width: 14 },
  { header: 'Last Name',    key: 'last_name',     width: 14 },
  { header: 'Class',        key: 'class_name',    width: 8  },
  { header: 'Section',      key: 'section',       width: 10 },
  { header: 'Gender',       key: 'gender',        width: 10 },
  { header: 'DOB',          key: 'date_of_birth', width: 14 },
  { header: 'Guardian',     key: 'guardian_name', width: 20 },
  { header: 'Phone',        key: 'guardian_phone',width: 14 },
  { header: 'Status',       key: 'is_active',     width: 10 },
]

export function studentToRow(s: any): (string|number)[] {
  return [s.admission_no, `${s.first_name} ${s.last_name}`, s.class_name, s.section||'—', s.guardian_name, s.guardian_phone, s.is_active?'Active':'Inactive']
}

// ── Fee report helpers ──────────────────────────────────────────────
export const FEE_COLUMNS_PDF   = ['Invoice','Student ID','Amount','Paid','Status','Method','Paid At']
export const FEE_COLUMNS_EXCEL = [
  { header: 'Invoice No',    key: 'invoice_no',     width: 18 },
  { header: 'Student ID',    key: 'student_id',     width: 12 },
  { header: 'Amount',        key: 'amount',         width: 14 },
  { header: 'Paid Amount',   key: 'paid_amount',    width: 14 },
  { header: 'Status',        key: 'status',         width: 12 },
  { header: 'Method',        key: 'payment_method', width: 12 },
  { header: 'Due Date',      key: 'due_date',       width: 14 },
  { header: 'Paid At',       key: 'paid_at',        width: 14 },
]

export function feeToRow(f: any): (string|number)[] {
  return [f.invoice_no, f.student_id, f.amount, f.paid_amount, f.status, f.payment_method||'—', f.paid_at ? new Date(f.paid_at).toLocaleDateString('en-IN') : '—']
}
