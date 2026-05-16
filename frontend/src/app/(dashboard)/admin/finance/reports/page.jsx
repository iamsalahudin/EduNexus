'use client'
import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select } from '@/components/ui'
import { fetchFinanceCategories, fetchFinanceReports } from '@/services/financeService'

export default function FinanceReportsPage() {
  const [categories, setCategories] = useState([])
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ income: 0, expense: 0, liabilities: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportType, setReportType] = useState('balance-sheet')
  const [categoryId, setCategoryId] = useState('')
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [categoriesData, reportData] = await Promise.all([
        fetchFinanceCategories({}),
        fetchFinanceReports({ type: reportType, categoryId, startDate, endDate })
      ])
      setCategories(categoriesData)
      setRows(Array.isArray(reportData.rows) ? reportData.rows : [])
      setTotals(reportData.totals || { income: 0, expense: 0, liabilities: 0, balance: 0 })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRows = rows.filter((row) => {
    if (!query) return true
    const text = query.toLowerCase()
    return [row.title, row.categoryName, row.type]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(text))
  })

  function tableHeaders() {
    if (reportType === 'liability' || reportType === 'debt') {
      return ['Date', 'Title', 'Category', 'Amount', 'Outstanding', 'Status']
    }
    return ['Date', 'Title', 'Category', 'Amount', 'Type']
  }

  function rowToCells(row) {
    if (reportType === 'liability' || reportType === 'debt') {
      return [
        row.date ? new Date(row.date).toLocaleDateString() : '-',
        row.title || '-',
        row.categoryName || '-',
        Number(row.amount || 0).toFixed(2),
        Number(row.outstandingAmount || 0).toFixed(2),
        row.type || '-'
      ]
    }
    return [
      row.date ? new Date(row.date).toLocaleDateString() : '-',
      row.title || '-',
      row.categoryName || '-',
      Number(row.amount || 0).toFixed(2),
      row.type || '-'
    ]
  }

  function downloadCsv() {
    const headers = tableHeaders()
    const lines = [headers, ...filteredRows.map((row) => rowToCells(row))]
    const csv = lines.map((line) => line.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-${reportType}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const payload = filteredRows.map((row) => {
        const base = {
          Date: row.date ? new Date(row.date).toLocaleDateString() : '-',
          Title: row.title || '-',
          Category: row.categoryName || '-',
          Amount: Number(row.amount || 0),
          Type: row.type || '-'
        }
        if (reportType === 'liability' || reportType === 'debt') {
          base.Outstanding = Number(row.outstandingAmount || 0)
        }
        return base
      })
      const ws = XLSX.utils.json_to_sheet(payload)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FinanceReport')
      const wbOut = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([wbOut], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-${reportType}-report.xlsx`
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
      const doc = new jsPDF('portrait', 'pt', 'a4')
      doc.setFontSize(14)
      doc.text(`Finance Report: ${reportType}`, 40, 40)
      doc.setFontSize(10)
      let y = 68
      filteredRows.forEach((row) => {
        const text = `${row.date ? new Date(row.date).toLocaleDateString() : '-'} | ${row.title || '-'} | Rs ${Number(row.amount || 0).toLocaleString()}`
        doc.text(text, 40, y)
        y += 16
        if (y > 760) {
          doc.addPage()
          y = 40
        }
      })
      doc.save(`finance-${reportType}-report.pdf`)
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Reports"
        subtitle="Generate and export Income, Expense, Liability, Debt, and Balance Sheet reports."
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Generate Custom Reports</h2>

        <div className="grid gap-3 md:grid-cols-6 mb-4">
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="balance-sheet">Balance Sheet</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="liability">Liabilities</option>
            <option value="debt">Debt</option>
          </Select>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name} ({category.type})</option>
            ))}
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rows"
          />
          <div className="flex gap-2">
            <Button onClick={loadData} variant="primary" disabled={loading}>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card><div className="text-xs text-gray-500">Income</div><div className="mt-1 text-lg font-semibold">Rs {Number(totals.income || 0).toLocaleString()}</div></Card>
          <Card><div className="text-xs text-gray-500">Expense</div><div className="mt-1 text-lg font-semibold">Rs {Number(totals.expense || 0).toLocaleString()}</div></Card>
          <Card><div className="text-xs text-gray-500">Liabilities</div><div className="mt-1 text-lg font-semibold">Rs {Number(totals.liabilities || 0).toLocaleString()}</div></Card>
          <Card><div className="text-xs text-gray-500">Net Balance</div><div className="mt-1 text-lg font-semibold">Rs {Number(totals.balance || 0).toLocaleString()}</div></Card>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={downloadCsv} disabled={!filteredRows.length}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx} disabled={!filteredRows.length}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf} disabled={!filteredRows.length}>PDF</Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Amount</th>
                {(reportType === 'liability' || reportType === 'debt') ? <th className="py-2 pr-3">Outstanding</th> : null}
                <th className="py-2 pr-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={(reportType === 'liability' || reportType === 'debt') ? 6 : 5} className="py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredRows.length ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-3 pr-3">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                    <td className="py-3 pr-3">{row.title || '-'}</td>
                    <td className="py-3 pr-3">{row.categoryName || '-'}</td>
                    <td className="py-3 pr-3">Rs {Number(row.amount || 0).toLocaleString()}</td>
                    {(reportType === 'liability' || reportType === 'debt') ? <td className="py-3 pr-3">Rs {Number(row.outstandingAmount || 0).toLocaleString()}</td> : null}
                    <td className="py-3 pr-3">{row.type || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={(reportType === 'liability' || reportType === 'debt') ? 6 : 5} className="py-4 text-center text-gray-500">No rows found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
