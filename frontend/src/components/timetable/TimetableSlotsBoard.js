<<<<<<< HEAD
'use client'

import { useMemo, useRef } from 'react'
import { Button } from '@/components/ui'

function sortTimeRanges(timeRanges) {
  return [...timeRanges].sort((a, b) => {
    const [aStart = ''] = String(a).split('-')
    const [bStart = ''] = String(b).split('-')
    return aStart.localeCompare(bStart)
  })
}

function getSubjectName(slot) {
  if (!slot?.subject) return 'Unassigned subject'
  if (typeof slot.subject === 'string') return slot.subject
  return String(slot.subject?.name || slot.subject?.code || slot.subject?._id || 'Unassigned subject')
}

function getClassName(slot) {
  return String(slot?.class || '').trim() || '—'
}

function getRoomName(slot) {
  return String(slot?.room || '').trim() || '—'
}

function getNormalizedRange(slot) {
  const start = String(slot?.startTime || '').trim()
  const end = String(slot?.endTime || '').trim()
  if (start && end) return `${start}-${end}`

  const legacy = String(slot?.time || '').trim()
  if (!legacy) return ''

  const parts = legacy.split(' - ').map((v) => String(v || '').trim()).filter(Boolean)
  if (parts.length === 2) return `${parts[0]}-${parts[1]}`

  const compact = legacy.split('-').map((v) => String(v || '').trim()).filter(Boolean)
  if (compact.length === 2) return `${compact[0]}-${compact[1]}`

  return ''
}

function getTeacherName(slot) {
  if (!slot?.teacher) return '—'
  if (typeof slot.teacher === 'string') return slot.teacher
  return String(slot.teacher?.name || slot.teacher?.username || slot.teacher?._id || '—')
}

function getDayLabel(slot) {
  return String(slot?.day || slot?.weekday || slot?.weekDay || slot?.dayName || slot?.dayOfWeek || slot?.dow || '').trim()
}

function buildTimeMatrix(slots, collapseSinglePerRange = false) {
  const timeSet = new Set()
  const byRange = {}

  slots.forEach((slot) => {
    const range = getNormalizedRange(slot)
    if (!range) return

    timeSet.add(range)

    if (!byRange[range]) byRange[range] = []
    if (collapseSinglePerRange) {
      if (byRange[range].length === 0) byRange[range].push(slot)
      return
    }
    byRange[range].push(slot)
  })

  return {
    timeRanges: sortTimeRanges(Array.from(timeSet)),
    byRange,
  }
}

function lectureSummary(slot, viewRole = 'admin') {
  const subject = getSubjectName(slot)
  const room = getRoomName(slot)
  const teacher = getTeacherName(slot)
  
  // For by-class view, include teacher name; otherwise omit for simplicity
  if (viewRole === 'by-class') {
    return `${teacher} - ${subject} (Room ${room})`
  }
  return `${subject} (Room ${room})`
}

function showDayInCard(viewRole) {
  return viewRole !== 'by-class' && viewRole !== 'by-teacher'
}

function normalizeSlotSignature(slot, viewRole) {
  if (viewRole === 'by-class') {
    return [
      getNormalizedRange(slot),
      getTeacherName(slot),
      getSubjectName(slot),
      getRoomName(slot)
    ].join('|').toLowerCase()
  }

  if (viewRole === 'by-teacher') {
    return [
      getNormalizedRange(slot),
      getSubjectName(slot),
      getClassName(slot),
      getRoomName(slot)
    ].join('|').toLowerCase()
  }

  return [
    getNormalizedRange(slot),
    getSubjectName(slot),
    getTeacherName(slot),
    getClassName(slot),
    getRoomName(slot)
  ].join('|').toLowerCase()
}

function getDisplaySlots(rangeSlots, viewRole) {
  const list = Array.isArray(rangeSlots) ? rangeSlots : []
  if (!list.length) return []

  const seen = new Set()
  const deduped = []
  for (const slot of list) {
    const sig = normalizeSlotSignature(slot, viewRole)
    if (seen.has(sig)) continue
    seen.add(sig)
    deduped.push(slot)
  }

  if (viewRole === 'by-class' || viewRole === 'by-teacher') {
    return deduped.length ? [deduped[0]] : []
  }

  return deduped
}

export default function TimetableSlotsBoard({ timetable, viewRole = 'admin' }) {
  const slots = Array.isArray(timetable?.slots) ? timetable.slots : []
  const exportRef = useRef(null)
  const shouldCollapsePerRange = viewRole === 'by-class' || viewRole === 'by-teacher'

  const { timeRanges, byRange } = useMemo(
    () => buildTimeMatrix(slots, shouldCollapsePerRange),
    [slots, shouldCollapsePerRange]
  )

  if (!slots.length) {
    return <div className="text-sm text-gray-600">No periods found in this timetable.</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Year: <span className="font-medium text-gray-900">{timetable?.year || '—'}</span>
        {' · '}
        Level: <span className="font-medium text-gray-900">{timetable?.level || '—'}</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="text-sm text-gray-600">All timetable periods</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          <Button variant="outline" onClick={exportXLSX}>Export XLSX</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border-b border-r">Time</th>
              <th className="p-2 border-b">Lectures</th>
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr key={range} className="align-top">
                <td className="p-2 border-b border-r font-medium whitespace-nowrap">{range}</td>
                <td className="p-2 border-b min-w-48">
                  {getDisplaySlots(byRange[range], viewRole).length ? (
                    <div className="space-y-1.5">
                      {getDisplaySlots(byRange[range], viewRole).map((slot, idx) => (
                        <div key={`${range}-${idx}`} className="rounded border border-gray-200 p-1.5">
                          {viewRole === 'by-class' ? (
                            <>
                              <div className="font-medium">{getTeacherName(slot)}</div>
                              <div className="text-xs text-gray-600">{getSubjectName(slot)}</div>
                              {showDayInCard(viewRole) && getDayLabel(slot) ? <div className="text-xs text-gray-600">Day: {getDayLabel(slot)}</div> : null}
                              <div className="text-xs text-gray-600">Room: {getRoomName(slot)}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{getSubjectName(slot)}</div>
                              {showDayInCard(viewRole) && getDayLabel(slot) ? <div className="text-xs text-gray-600">Day: {getDayLabel(slot)}</div> : null}
                              <div className="text-xs text-gray-600">Class: {getClassName(slot)}</div>
                              <div className="text-xs text-gray-600">Room: {getRoomName(slot)}</div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!timeRanges.length ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-500">No lectures found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div ref={exportRef} className="hidden">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Lectures</th>
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr key={`export-${range}`}>
                <td>{range}</td>
                <td>{getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  function exportCSV() {
    const headers = ['Time', 'Lectures']
    const rows = [headers.map((h) => `"${h}"`).join(',')]

    timeRanges.forEach((range) => {
      const value = getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')
      const row = [`"${range}"`, `"${value}"`]
      rows.push(row.join(','))
    })

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const fileName = `timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.csv`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function exportXLSX() {
    try {
      const XLSX = await import('xlsx')
      const data = [['Time', 'Lectures']]

      timeRanges.forEach((range) => {
        const row = [range, getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')]
        data.push(row)
      })

      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Timetable')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('XLSX export is unavailable, falling back to CSV.', err)
      exportCSV()
    }
  }

  async function exportPDF() {
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default

      if (!exportRef.current) return

      const canvas = await html2canvas(exportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgProps = pdf.getImageProperties(imgData)
      const imgWidth = pageWidth - 40
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
      pdf.save(`timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export is unavailable. Please try CSV or XLSX format instead.')
    }
  }
}

function trimText(value) {
  return String(value || '').trim()
=======
'use client'

import { useMemo, useRef } from 'react'
import { Button } from '@/components/ui'

function sortTimeRanges(timeRanges) {
  return [...timeRanges].sort((a, b) => {
    const [aStart = ''] = String(a).split('-')
    const [bStart = ''] = String(b).split('-')
    return aStart.localeCompare(bStart)
  })
}

function getSubjectName(slot) {
  if (!slot?.subject) return 'Unassigned subject'
  if (typeof slot.subject === 'string') return slot.subject
  return String(slot.subject?.name || slot.subject?.code || slot.subject?._id || 'Unassigned subject')
}

function getClassName(slot) {
  return String(slot?.class || '').trim() || '—'
}

function getRoomName(slot) {
  return String(slot?.room || '').trim() || '—'
}

function getNormalizedRange(slot) {
  const start = String(slot?.startTime || '').trim()
  const end = String(slot?.endTime || '').trim()
  if (start && end) return `${start}-${end}`

  const legacy = String(slot?.time || '').trim()
  if (!legacy) return ''

  const parts = legacy.split(' - ').map((v) => String(v || '').trim()).filter(Boolean)
  if (parts.length === 2) return `${parts[0]}-${parts[1]}`

  const compact = legacy.split('-').map((v) => String(v || '').trim()).filter(Boolean)
  if (compact.length === 2) return `${compact[0]}-${compact[1]}`

  return ''
}

function getTeacherName(slot) {
  if (!slot?.teacher) return '—'
  if (typeof slot.teacher === 'string') return slot.teacher
  return String(slot.teacher?.name || slot.teacher?.username || slot.teacher?._id || '—')
}

function getDayLabel(slot) {
  return String(slot?.day || slot?.weekday || slot?.weekDay || slot?.dayName || slot?.dayOfWeek || slot?.dow || '').trim()
}

function buildTimeMatrix(slots, collapseSinglePerRange = false) {
  const timeSet = new Set()
  const byRange = {}

  slots.forEach((slot) => {
    const range = getNormalizedRange(slot)
    if (!range) return

    timeSet.add(range)

    if (!byRange[range]) byRange[range] = []
    if (collapseSinglePerRange) {
      if (byRange[range].length === 0) byRange[range].push(slot)
      return
    }
    byRange[range].push(slot)
  })

  return {
    timeRanges: sortTimeRanges(Array.from(timeSet)),
    byRange,
  }
}

function lectureSummary(slot, viewRole = 'admin') {
  const subject = getSubjectName(slot)
  const room = getRoomName(slot)
  const teacher = getTeacherName(slot)
  
  // For by-class view, include teacher name; otherwise omit for simplicity
  if (viewRole === 'by-class') {
    return `${teacher} - ${subject} (Room ${room})`
  }
  return `${subject} (Room ${room})`
}

function showDayInCard(viewRole) {
  return viewRole !== 'by-class' && viewRole !== 'by-teacher'
}

function normalizeSlotSignature(slot, viewRole) {
  if (viewRole === 'by-class') {
    return [
      getNormalizedRange(slot),
      getTeacherName(slot),
      getSubjectName(slot),
      getRoomName(slot)
    ].join('|').toLowerCase()
  }

  if (viewRole === 'by-teacher') {
    return [
      getNormalizedRange(slot),
      getSubjectName(slot),
      getClassName(slot),
      getRoomName(slot)
    ].join('|').toLowerCase()
  }

  return [
    getNormalizedRange(slot),
    getSubjectName(slot),
    getTeacherName(slot),
    getClassName(slot),
    getRoomName(slot)
  ].join('|').toLowerCase()
}

function getDisplaySlots(rangeSlots, viewRole) {
  const list = Array.isArray(rangeSlots) ? rangeSlots : []
  if (!list.length) return []

  const seen = new Set()
  const deduped = []
  for (const slot of list) {
    const sig = normalizeSlotSignature(slot, viewRole)
    if (seen.has(sig)) continue
    seen.add(sig)
    deduped.push(slot)
  }

  if (viewRole === 'by-class' || viewRole === 'by-teacher') {
    return deduped.length ? [deduped[0]] : []
  }

  return deduped
}

export default function TimetableSlotsBoard({ timetable, viewRole = 'admin' }) {
  const slots = Array.isArray(timetable?.slots) ? timetable.slots : []
  const exportRef = useRef(null)
  const shouldCollapsePerRange = viewRole === 'by-class' || viewRole === 'by-teacher'

  const { timeRanges, byRange } = useMemo(
    () => buildTimeMatrix(slots, shouldCollapsePerRange),
    [slots, shouldCollapsePerRange]
  )

  if (!slots.length) {
    return <div className="text-sm text-gray-600">No periods found in this timetable.</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Year: <span className="font-medium text-gray-900">{timetable?.year || '—'}</span>
        {' · '}
        Level: <span className="font-medium text-gray-900">{timetable?.level || '—'}</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="text-sm text-gray-600">All timetable periods</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          <Button variant="outline" onClick={exportXLSX}>Export XLSX</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border-b border-r">Time</th>
              <th className="p-2 border-b">Lectures</th>
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr key={range} className="align-top">
                <td className="p-2 border-b border-r font-medium whitespace-nowrap">{range}</td>
                <td className="p-2 border-b min-w-48">
                  {getDisplaySlots(byRange[range], viewRole).length ? (
                    <div className="space-y-1.5">
                      {getDisplaySlots(byRange[range], viewRole).map((slot, idx) => (
                        <div key={`${range}-${idx}`} className="rounded border border-gray-200 p-1.5">
                          {viewRole === 'by-class' ? (
                            <>
                              <div className="font-medium">{getTeacherName(slot)}</div>
                              <div className="text-xs text-gray-600">{getSubjectName(slot)}</div>
                              {showDayInCard(viewRole) && getDayLabel(slot) ? <div className="text-xs text-gray-600">Day: {getDayLabel(slot)}</div> : null}
                              <div className="text-xs text-gray-600">Room: {getRoomName(slot)}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{getSubjectName(slot)}</div>
                              {showDayInCard(viewRole) && getDayLabel(slot) ? <div className="text-xs text-gray-600">Day: {getDayLabel(slot)}</div> : null}
                              <div className="text-xs text-gray-600">Class: {getClassName(slot)}</div>
                              <div className="text-xs text-gray-600">Room: {getRoomName(slot)}</div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!timeRanges.length ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-500">No lectures found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div ref={exportRef} className="hidden">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Lectures</th>
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr key={`export-${range}`}>
                <td>{range}</td>
                <td>{getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  function exportCSV() {
    const headers = ['Time', 'Lectures']
    const rows = [headers.map((h) => `"${h}"`).join(',')]

    timeRanges.forEach((range) => {
      const value = getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')
      const row = [`"${range}"`, `"${value}"`]
      rows.push(row.join(','))
    })

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const fileName = `timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.csv`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function exportXLSX() {
    try {
      const XLSX = await import('xlsx')
      const data = [['Time', 'Lectures']]

      timeRanges.forEach((range) => {
        const row = [range, getDisplaySlots(byRange[range], viewRole).map((slot) => lectureSummary(slot, viewRole)).join(' | ')]
        data.push(row)
      })

      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Timetable')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('XLSX export is unavailable, falling back to CSV.', err)
      exportCSV()
    }
  }

  async function exportPDF() {
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default

      if (!exportRef.current) return

      const canvas = await html2canvas(exportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgProps = pdf.getImageProperties(imgData)
      const imgWidth = pageWidth - 40
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
      pdf.save(`timetable-${trimText(timetable?.level || 'all')}-${trimText(timetable?.year || '')}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export is unavailable. Please try CSV or XLSX format instead.')
    }
  }
}

function trimText(value) {
  return String(value || '').trim()
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}