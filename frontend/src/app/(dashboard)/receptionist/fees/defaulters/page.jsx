'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetchFeeDefaulters } from '@/services/feesService'
import { Button, Card, Input, PageHeader, Select } from '@/components/ui'

function toCSV(rows) {
  if (!rows.length) return ''
  const keys = ['roll', 'name', 'class', 'section', 'pendingFee', 'status']
  const lines = [keys.join(',')]
  rows.forEach((row) => {
    lines.push(keys.map((key) => JSON.stringify(row?.[key] ?? '')).join(','))
  })
  return lines.join('\n')
}

export default function FeeDefaultersPage() {
  const { data: rows = [], isLoading } = useSWR('receptionFeeDefaulters', () => fetchFeeDefaulters({}))
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const filteredRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const queryText = String(query || '').trim().toLowerCase()
      const rowText = `${row?.roll || ''} ${row?.name || ''} ${row?.class || ''} ${row?.section || ''}`.toLowerCase()
      const classOk = !classFilter || String(row?.class || '') === classFilter
      const queryOk = !queryText || rowText.includes(queryText)
      return classOk && queryOk
    })
  }, [rows, query, classFilter])

  const classOptions = useMemo(() => {
    return [...new Set(filteredRows.map((row) => String(row?.class || '').trim()).filter(Boolean))].sort()
  }, [filteredRows])

  const totalPending = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + Number(row?.pendingFee || 0), 0)
  }, [filteredRows])

  function downloadCsv() {
    const csv = toCSV(filteredRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reception-fee-defaulters.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(filteredRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Defaulters')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reception-fee-defaulters.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
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
      pdf.text('Reception Defaulters Report', 40, 40)
      pdf.setFontSize(10)
      let y = 70
      filteredRows.forEach((row) => {
        pdf.text(`${row.roll} - ${row.name} (${row.class}-${row.section}) Pending: Rs ${row.pendingFee || 0}`, 40, y)
        y += 16
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save('reception-fee-defaulters.pdf')
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Fee Defaulters"
          subtitle="Read and download pending fee records by class or student search."
        />
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={downloadCsv}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by roll, name, class, section" />
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <div className="text-sm text-gray-600 flex items-center">Total pending liability: Rs {totalPending}</div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="text-sm text-gray-600">Loading defaulters...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Roll</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Class</th>
                  <th className="text-right">Pending Fee</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-none">
                    <td className="py-2">{row.roll}</td>
                    <td>{row.name}</td>
                    <td>{row.class} - {row.section}</td>
                    <td className="text-right">Rs {row.pendingFee || 0}</td>
                    <td>{row.status || 'Pending'}</td>
                  </tr>
                ))}
                {!filteredRows.length ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No defaulters found for current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
