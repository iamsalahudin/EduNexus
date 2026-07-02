'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetchFeeDefaulters, fetchFeeRecords } from '@/services/feesService'
import { Button, Card, Input, PageHeader, Select } from '@/components/ui'

function toCSV(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    lines.push(headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))
  })
  return lines.join('\n')
}

export default function StudentFeeStatusPage() {
  const [period, setPeriod] = useState('this-month')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [query, setQuery] = useState('')

  const filters = useMemo(() => {
    if (period === 'custom') {
      return { period, from: fromDate || undefined, to: toDate || undefined }
    }
    return { period }
  }, [period, fromDate, toDate])

  const { data: records = [] } = useSWR(['accountantFeeRecords', filters], () => fetchFeeRecords(filters))
  const { data: defaulters = [] } = useSWR(['accountantFeeDefaulters', filters], () => fetchFeeDefaulters(filters))

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return Array.isArray(records) ? records : []
    return (Array.isArray(records) ? records : []).filter((row) => {
      const value = `${row?.roll || ''} ${row?.name || ''} ${row?.class || ''} ${row?.section || ''}`.toLowerCase()
      return value.includes(q)
    })
  }, [records, query])

  const totals = useMemo(() => {
    return filtered.reduce((acc, row) => {
      acc.collected += Number(row?.monthlyFee || 0)
      acc.pending += Number(row?.pendingFee || 0)
      return acc
    }, { collected: 0, pending: 0 })
  }, [filtered])

  function downloadCsv() {
    const csv = toCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'finance-fee-status.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(filtered)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FeeStatus')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'finance-fee-status.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      downloadCsv()
    }
  }

  async function downloadPdf() {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      const pdf = new jsPDF('portrait', 'pt', 'a4')
      pdf.setFontSize(14)
      pdf.text('Finance Fee Status Report', 40, 40)
      pdf.setFontSize(10)
      let y = 64
      filtered.forEach((row) => {
        pdf.text(`${row.roll} - ${row.name} (${row.class}-${row.section}) | Pending: Rs ${row.pendingFee || 0}`, 40, y)
        y += 16
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save('finance-fee-status.pdf')
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Student Fee Status"
          subtitle="Timewise fee records and defaulter analysis for finance review."
        />
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={downloadCsv}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Selected Duration</option>
          </Select>
          {period === 'custom' ? (
            <>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          ) : (
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, class, section" />
          )}
          {period === 'custom' ? (
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, class, section" />
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Students in Scope</div>
          <div className="text-xl font-semibold mt-1">{filtered.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Collected</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.collected}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Defaulters</div>
          <div className="text-xl font-semibold mt-1">{Array.isArray(defaulters) ? defaulters.length : 0}</div>
        </div>
      </div>

      <Card>
        <div className="font-medium mb-3">Timewise Fee Records</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Roll</th>
                <th className="text-left">Name</th>
                <th className="text-left">Class</th>
                <th className="text-right">Monthly Fee</th>
                <th className="text-right">Pending</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-none">
                  <td className="py-2">{row.roll || '—'}</td>
                  <td>{row.name || '—'}</td>
                  <td>{row.class || '—'} {row.section ? `(${row.section})` : ''}</td>
                  <td className="text-right">Rs {row.monthlyFee || 0}</td>
                  <td className="text-right">Rs {row.pendingFee || 0}</td>
                  <td>{row.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
