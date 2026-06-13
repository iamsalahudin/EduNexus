'use client'

import { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from '@/components/ui'
import { fetchFeeDefaulters, fetchFeeRecords } from '@/services/feesService'
import useSWR from 'swr'

function toCSV(rows) {
  if (!rows || rows.length === 0) return ''
  const keys = Object.keys(rows[0])
  const lines = [keys.join(',')].concat(rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')))
  return lines.join('\n')
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function matchesFilters(row, query, classFilter) {
  const q = normalizeText(query)
  const text = normalizeText(`${row?.roll || ''} ${row?.name || ''} ${row?.class || ''} ${row?.section || ''} ${row?.father || ''}`)
  const classOk = !classFilter || String(row?.class || '') === classFilter
  const qOk = !q || text.includes(q)
  return classOk && qOk
}

function downloadBlob(rows, filename, type = 'text/csv') {
  const blob = new Blob([rows], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function FeeReportWorkspace({
  mode = 'records',
  roleBase = '/admin',
  title = 'Fee Report',
  subtitle = 'Monthly & yearly fee submission tables and analytics.',
  summary = {},
  reportLinks = [],
  defaultClassFilter = '',
  detailBasePath = '/admin/fees'
}) {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState(defaultClassFilter)

  const shouldLoadDefaulters = mode === 'defaulters'
  const { data: records = [] } = useSWR(
    mode === 'trend' ? `${roleBase}-trend-records` : `${roleBase}-records`,
    () => fetchFeeRecords({})
  )
  const { data: defaulters = [] } = useSWR(
    `${roleBase}-${mode}-defaulters`,
    () => fetchFeeDefaulters({}),
    { isPaused: () => !shouldLoadDefaulters }
  )

  const sourceRows = mode === 'defaulters' ? defaulters : records
  const filteredRows = useMemo(() => {
    return (Array.isArray(sourceRows) ? sourceRows : []).filter((row) => matchesFilters(row, query, classFilter))
  }, [sourceRows, query, classFilter])

  const classOptions = useMemo(() => {
    const values = [...new Set((Array.isArray(sourceRows) ? sourceRows : []).map((r) => String(r?.class || '').trim()).filter(Boolean))]
    return values.sort()
  }, [sourceRows])

  const monthlyRows = useMemo(() => {
    const now = new Date()
    const monthLabel = now.toLocaleString('en-US', { month: 'short' })
    const collected = filteredRows
      .filter((r) => normalizeText(r?.status) === 'paid')
      .reduce((sum, r) => sum + Number(r?.monthlyFee || 0), 0)
    const pending = filteredRows
      .filter((r) => normalizeText(r?.status) !== 'paid')
      .reduce((sum, r) => sum + Number(r?.pendingFee || 0), 0)

    return [{ month: `${monthLabel} ${now.getFullYear()}`, students: filteredRows.length, collected, pending }]
  }, [filteredRows])

  const yearlyRows = useMemo(() => {
    const year = new Date().getFullYear()
    const collected = filteredRows
      .filter((r) => normalizeText(r?.status) === 'paid')
      .reduce((sum, r) => sum + Number(r?.monthlyFee || 0), 0)
    const pending = filteredRows.reduce((sum, r) => sum + Number(r?.pendingFee || 0), 0)

    return [{ year, students: filteredRows.length, defaulters: (Array.isArray(defaulters) ? defaulters : []).length, collected, pending }]
  }, [filteredRows, defaulters])

  async function downloadCsv() {
    const csv = toCSV(filteredRows)
    downloadBlob(csv, `${mode}-fee-report.csv`)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(filteredRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FeeReport')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${mode}-fee-report.xlsx`
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
      pdf.text(title, 40, 40)
      pdf.setFontSize(10)
      let y = 70
      filteredRows.forEach((row) => {
        const line = `${row.roll || '—'} - ${row.name || '—'} (${row.class || '—'}-${row.section || '—'}) | Pending: Rs ${row.pendingFee || 0}`
        pdf.text(line, 40, y)
        y += 18
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save(`${mode}-fee-report.pdf`)
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="primary" onClick={downloadCsv}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      {reportLinks.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reportLinks.map((link) => (
            <a key={link.href} href={link.href} className="rounded-xl border bg-white p-4 hover-theme-primary transition">
              <div className="font-semibold">{link.label}</div>
              <div className="mt-1 text-sm text-gray-600">{link.description}</div>
            </a>
          ))}
        </div>
      ) : null}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by roll, name, class, section" />
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classOptions.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
          </Select>
          <div className="text-sm text-gray-600 flex items-center">Rows: {filteredRows.length}</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="font-medium mb-2">Monthly Snapshot</div>
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Month</TableHeader>
                  <TableHeader className="text-right">Students</TableHeader>
                  <TableHeader className="text-right">Collected</TableHeader>
                  <TableHeader className="text-right">Pending</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyRows.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell className="text-right">{row.students}</TableCell>
                    <TableCell className="text-right">Rs {row.collected}</TableCell>
                    <TableCell className="text-right">Rs {row.pending}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </Table>
        </Card>
        <Card>
          <div className="font-medium mb-2">Yearly Snapshot</div>
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Year</TableHeader>
                  <TableHeader className="text-right">Students</TableHeader>
                  <TableHeader className="text-right">Defaulters</TableHeader>
                  <TableHeader className="text-right">Collected</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearlyRows.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell className="text-right">{row.students}</TableCell>
                    <TableCell className="text-right">{row.defaulters}</TableCell>
                    <TableCell className="text-right">Rs {row.collected}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </Table>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Detailed Rows</div>
          <div className="text-xs text-gray-500">Click a row to open its fee details</div>
        </div>
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableHeader>Roll</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Class</TableHeader>
                <TableHeader>Section</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Pending</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.assign(`${detailBasePath}/${row.id}`)}>
                  <TableCell>{row.roll || '—'}</TableCell>
                  <TableCell>{row.name || '—'}</TableCell>
                  <TableCell>{row.class || '—'}</TableCell>
                  <TableCell>{row.section || '—'}</TableCell>
                  <TableCell>{row.status || '—'}</TableCell>
                  <TableCell className="text-right">Rs {row.pendingFee || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Table>
      </Card>
    </div>
  )
}