'use client'

import React, { useMemo, useRef } from 'react'
import { saveAs } from 'file-saver' // optional, gives nicer downloads for xlsx (if installed)
/*
 Note: file-saver is optional. If you don't want to install it, exportXLSX will fallback to using SheetJS writeFile directly
 (if SheetJS is installed). CSV and PDF fallback will work without extra libs.
*/

export default function ClassTimetableView({ timetable, classId }) {
  const containerRef = useRef(null)

  // days to display = days that exist in weeklyGrids keys. If only Mon has data then only ["Mon"]
  const allDays = Object.keys(timetable.weeklyGrids || {})
  // Determine which days have at least the class entry (non-null)
  const daysWithClass = useMemo(() => {
    return allDays.filter(d => {
      const dayGrid = (timetable.weeklyGrids || {})[d]
      if (!Array.isArray(dayGrid)) return false
      return dayGrid.some(c => c.id === classId)
    })
  }, [timetable, classId, allDays])

  // If only Monday available, show just [Mon] (will be caught by daysWithClass)
  const daysToShow = daysWithClass.length ? daysWithClass : allDays

  // time slots
  const timeSlots = timetable.timeSlots.map(ts => ts.label)

  // helper to get cell data for class/day/time
  function getCell(day, time) {
    const dayGrid = (timetable.weeklyGrids || {})[day]
    if (!Array.isArray(dayGrid)) return null
    const cls = dayGrid.find(c => c.id === classId)
    if (!cls) return null
    const p = cls.periods && cls.periods[time]
    return p || null
  }

  // Render table header: if only one day, special 2-column header: Time / Lecture
  const singleDay = daysToShow.length === 1

  /* ----------------- Exports ----------------- */

  // CSV
  function exportCSV() {
    const headers = singleDay ? ['Time', 'Lecture'] : ['Time', ...daysToShow]
    const rows = [headers.join(',')]
    for (const t of timeSlots) {
      const row = [ `"${t}"` ]
      if (singleDay) {
        const cell = getCell(daysToShow[0], t)
        row.push(`"${cell ? (cell.subject || '') + (cell.teacher ? ' / ' + cell.teacher : '') : ''}"`)
      } else {
        for (const d of daysToShow) {
          const cell = getCell(d, t)
          const text = cell ? `${cell.subject || ''}${cell.teacher ? ' / ' + cell.teacher : ''}` : ''
          row.push(`"${text}"`)
        }
      }
      rows.push(row.join(','))
    }
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const fname = `${classId}-timetable.csv`
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
      window.navigator.msSaveBlob(blob, fname)
    } else {
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', fname)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // XLSX (SheetJS) - optional
  async function exportXLSX() {
    try {
      const XLSX = await import('xlsx') // dynamic import: requires 'xlsx' package
      // build worksheet as array of arrays
      const data = []
      const headerRow = singleDay ? ['Time', 'Lecture'] : ['Time', ...daysToShow]
      data.push(headerRow)
      for (const t of timeSlots) {
        const row = [t]
        if (singleDay) {
          const cell = getCell(daysToShow[0], t)
          row.push(cell ? `${cell.subject || ''} ${cell.teacher ? ' / ' + cell.teacher : ''}` : '')
        } else {
          for (const d of daysToShow) {
            const cell = getCell(d, t)
            row.push(cell ? `${cell.subject || ''} ${cell.teacher ? ' / ' + cell.teacher : ''}` : '')
          }
        }
        data.push(row)
      }
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Timetable')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      // use file-saver if available
      try {
        await import('file-saver').then(mod => mod.saveAs(blob, `${classId}-timetable.xlsx`))
      } catch (e) {
        // fallback: create link
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${classId}-timetable.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // fallback to CSV if xlsx is not installed
      console.warn('xlsx library not found — falling back to CSV', err)
      exportCSV()
    }
  }

  // PDF export (html2canvas + jsPDF) - optional
  async function exportPDF() {
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).jsPDF || (await import('jspdf')).default
      if (!containerRef.current) { alert('No content to export'); return }
      const el = containerRef.current
      // temporarily increase scale for better resolution
      const canvas = await html2canvas(el, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      // fit image to page
      const imgProps = pdf.getImageProperties(imgData)
      const imgWidth = pageWidth - 40
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
      pdf.save(`${classId}-timetable.pdf`)
    } catch (err) {
      console.warn('PDF export libraries missing', err)
      alert('PDF export requires html2canvas + jspdf. Falling back to CSV.')
      exportCSV()
    }
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Timetable — {classId}</h2>
          <div className="text-sm text-gray-600">Time on the left, days across the top</div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3 py-2 border rounded text-sm">Export CSV</button>
          <button onClick={exportXLSX} className="px-3 py-2 border rounded text-sm">Export XLSX</button>
          <button onClick={exportPDF} className="px-3 py-2 border rounded text-sm">Export PDF</button>
        </div>
      </div>

      <div ref={containerRef} className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 border p-2 text-left">Time</th>
              {singleDay ? (
                <th className="border p-2 text-left">Lecture</th>
              ) : (
                daysToShow.map(d => (
                  <th key={d} className="border p-2 text-left">{d}</th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td className="border p-2 align-top font-medium">{time}</td>

                {singleDay ? (
                  <td className="border p-2 align-top">
                    {(() => {
                      const cell = getCell(daysToShow[0], time)
                      if (!cell) return <span className="text-gray-400">—</span>
                      return (
                        <div>
                          <div className="font-medium">{cell.subject}</div>
                          <div className="text-xs text-gray-600">{cell.teacher} {cell.room ? `· ${cell.room}` : ''}</div>
                        </div>
                      )
                    })()}
                  </td>
                ) : (
                  daysToShow.map(d => {
                    const cell = getCell(d, time)
                    return (
                      <td key={d + time} className="border p-2 align-top">
                        {cell ? (
                          <div>
                            <div className="font-medium">{cell.subject}</div>
                            <div className="text-xs text-gray-600">{cell.teacher} {cell.room ? `· ${cell.room}` : ''}</div>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    )
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
