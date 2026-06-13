'use client'

function toCsvValue(value) {
  return JSON.stringify(value ?? '')
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCsv({ headers = [], rows = [], mapRow, filename = 'export.csv' }) {
  const lines = []
  if (headers.length) {
    lines.push(headers.join(','))
  }
  rows.forEach((row) => {
    const cells = mapRow ? mapRow(row) : row
    lines.push((cells || []).map(toCsvValue).join(','))
  })
  downloadBlob(lines.join('\n'), filename, 'text/csv;charset=utf-8;')
}

export async function exportXlsx({ rows = [], mapRow, filename = 'export.xlsx', sheetName = 'Export' }) {
  const XLSX = await import('xlsx')
  const payload = rows.map((row) => (mapRow ? mapRow(row) : row))
  const ws = XLSX.utils.json_to_sheet(payload)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(wbout, filename, 'application/octet-stream')
}

export async function exportPdf({ title = 'Export', rows = [], mapRowToText, filename = 'export.pdf' }) {
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
  const pdf = new jsPDF('portrait', 'pt', 'a4')
  pdf.setFontSize(14)
  pdf.text(title, 40, 40)
  pdf.setFontSize(10)
  let y = 70
  rows.forEach((row) => {
    const text = mapRowToText ? mapRowToText(row) : String(row || '')
    pdf.text(text, 40, y)
    y += 16
    if (y > 760) {
      pdf.addPage()
      y = 40
    }
  })
  pdf.save(filename)
}
