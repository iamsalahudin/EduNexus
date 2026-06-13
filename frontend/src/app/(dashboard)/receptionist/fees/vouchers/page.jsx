'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetchFeeRecords } from '@/services/feesService'
import { Button, Card, Input, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from '@/components/ui'

function toCSV(rows) {
  if (!rows.length) return ''
  const keys = ['roll', 'name', 'class', 'section', 'monthlyFee', 'pendingFee', 'status', 'lastPaymentDate']
  const lines = [keys.join(',')]
  rows.forEach((row) => {
    lines.push(keys.map((key) => JSON.stringify(row?.[key] ?? '')).join(','))
  })
  return lines.join('\n')
}

export default function FeeVouchersPage() {
  const [period, setPeriod] = useState('this-month')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [query, setQuery] = useState('')

  const periodFilters = useMemo(() => {
    if (period === 'custom') {
      return { period, from: fromDate || undefined, to: toDate || undefined }
    }
    return { period }
  }, [period, fromDate, toDate])

  const cacheKey = `receptionFeeVoucherRows:${JSON.stringify(periodFilters)}`
  const { data: rows = [], isLoading } = useSWR(cacheKey, () => fetchFeeRecords(periodFilters))

  const filteredRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const text = `${row?.roll || ''} ${row?.name || ''} ${row?.class || ''} ${row?.section || ''}`.toLowerCase()
      return !query.trim() || text.includes(query.trim().toLowerCase())
    })
  }, [rows, query])

  const totals = useMemo(() => {
    return filteredRows.reduce((acc, row) => {
      acc.total += Number(row?.monthlyFee || 0)
      acc.pending += Number(row?.pendingFee || 0)
      return acc
    }, { total: 0, pending: 0 })
  }, [filteredRows])

  function downloadCsv() {
    const csv = toCSV(filteredRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reception-fee-voucher-report.csv'
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
      XLSX.utils.book_append_sheet(wb, ws, 'Vouchers')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reception-fee-voucher-report.xlsx'
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
      pdf.text('Reception Fee Voucher Report', 40, 40)
      pdf.setFontSize(10)
      let y = 70
      filteredRows.forEach((row) => {
        pdf.text(`${row.roll} - ${row.name} (${row.class}-${row.section}) Fee: Rs ${row.monthlyFee || 0} Pending: Rs ${row.pendingFee || 0}`, 40, y)
        y += 16
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save('reception-fee-voucher-report.pdf')
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Fee Reports & Vouchers"
          subtitle="Read fee records timewise and download voucher-style reports."
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
            <option value="custom">Custom</option>
          </Select>
          {period === 'custom' ? (
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          ) : (
            <div className="hidden md:block" />
          )}
          {period === 'custom' ? (
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          ) : (
            <div className="hidden md:block" />
          )}
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by roll, name, class" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Total Fee in Selection</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.total}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Pending in Selection</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.pending}</div>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading report rows...</div>
        ) : (
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Roll</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Class</TableHeader>
                  <TableHeader className="text-right">Monthly Fee</TableHeader>
                  <TableHeader className="text-right">Pending</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.roll}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.class} - {row.section}</TableCell>
                    <TableCell className="text-right">Rs {row.monthlyFee || 0}</TableCell>
                    <TableCell className="text-right">Rs {row.pendingFee || 0}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
                {!filteredRows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                      No records found for selected filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </TableRoot>
          </Table>
        )}
      </Card>
    </div>
  )
}
