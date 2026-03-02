/**
 * exportUtils.ts
 * Client-side PDF + Excel export helpers.
 *
 * PDF  → uses browser's window.print() with a hidden printable DOM
 * Excel → generates a real .xlsx using SheetJS (xlsx package)
 *
 * Install: npm install xlsx
 */

// ── CSV (no dependency) ──────────────────────────────────────────
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][][]) {
  const body = rows.map(r =>
    r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const csv  = [headers.map(h => `"${h}"`).join(','), body].join('\n')
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename)
}

// ── Excel (.xlsx via SheetJS) ────────────────────────────────────
export async function exportExcel(filename: string, sheetName: string, headers: string[], rows: unknown[][]) {
  const XLSX = await import('xlsx')
  const ws   = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 12) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// ── PDF via browser print ────────────────────────────────────────
export function exportPDF(title: string, subtitle: string, headers: string[], rows: (string | number)[][]) {
  const tableRows = rows.map(r =>
    `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`
  ).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
        .header { display: flex; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px; }
        .logo { width: 40px; height: 40px; background: #1e40af; border-radius: 8px;
                display: flex; align-items: center; justify-content: center; color: white;
                font-size: 18px; margin-right: 12px; }
        h1 { color: #1e40af; font-size: 18px; }
        .subtitle { color: #64748b; font-size: 11px; margin-top: 2px; }
        .meta { color: #94a3b8; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a8a; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🎓</div>
        <div>
          <h1>${title}</h1>
          <p class="subtitle">${subtitle}</p>
        </div>
      </div>
      <p class="meta">Generated on: ${new Date().toLocaleString('en-IN')}</p>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">School ERP System — Confidential Report</div>
    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Allow popups to export PDF'); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.print(); win.close() }, 500)
}

// ── Helper ───────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
