'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from '@/components/ui'
import { fetchFinanceCategories, fetchFinanceReports } from '@/services/financeService'
import { exportCsv, exportPdf, exportXlsx } from '@/components/finance/exportHelpers'

function formatAmount(value) {
  return Number(value || 0).toLocaleString()
}

export default function FinanceReportsWorkspace({
  title = 'Finance Reports',
  subtitle = 'Generate and export Income, Expense, Liability, Debt, and Balance Sheet reports.'
}) {
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
        fetchFinanceReports({ type: reportType, categoryId: categoryId || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
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

  const showOutstanding = reportType === 'liability' || reportType === 'debt'

  function tableHeaders() {
    if (showOutstanding) {
      return ['Date', 'Title', 'Category', 'Amount', 'Outstanding', 'Type']
    }
    return ['Date', 'Title', 'Category', 'Amount', 'Type']
  }

  function rowToCells(row) {
    const base = [
      row.date ? new Date(row.date).toLocaleDateString() : '-',
      row.title || '-',
      row.categoryName || '-',
      Number(row.amount || 0).toFixed(2)
    ]
    if (showOutstanding) {
      base.push(Number(row.outstandingAmount || 0).toFixed(2))
    }
    base.push(row.type || '-')
    return base
  }

  function rowToObject(row) {
    const base = {
      Date: row.date ? new Date(row.date).toLocaleDateString() : '-',
      Title: row.title || '-',
      Category: row.categoryName || '-',
      Amount: Number(row.amount || 0)
    }
    if (showOutstanding) {
      base.Outstanding = Number(row.outstandingAmount || 0)
    }
    base.Type = row.type || '-'
    return base
  }

  function rowToText(row) {
    const date = row.date ? new Date(row.date).toLocaleDateString() : '-'
    return `${date} | ${row.title || '-'} | Rs ${formatAmount(row.amount)}`
  }

  function downloadCsv() {
    exportCsv({
      headers: tableHeaders(),
      rows: filteredRows,
      mapRow: rowToCells,
      filename: `finance-${reportType}-report.csv`
    })
  }

  async function downloadXlsx() {
    try {
      await exportXlsx({
        rows: filteredRows,
        mapRow: rowToObject,
        filename: `finance-${reportType}-report.xlsx`,
        sheetName: 'FinanceReport'
      })
    } catch {
      downloadCsv()
    }
  }

  async function downloadPdf() {
    try {
      await exportPdf({
        title: `Finance Report: ${reportType}`,
        rows: filteredRows,
        mapRowToText: rowToText,
        filename: `finance-${reportType}-report.pdf`
      })
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rows" />
          <div className="flex gap-2">
            <Button onClick={loadData} variant="primary" disabled={loading}>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card><div className="text-xs text-gray-500">Income</div><div className="mt-1 text-lg font-semibold">Rs {formatAmount(totals.income)}</div></Card>
          <Card><div className="text-xs text-gray-500">Expense</div><div className="mt-1 text-lg font-semibold">Rs {formatAmount(totals.expense)}</div></Card>
          <Card><div className="text-xs text-gray-500">Liabilities</div><div className="mt-1 text-lg font-semibold">Rs {formatAmount(totals.liabilities)}</div></Card>
          <Card><div className="text-xs text-gray-500">Net Balance</div><div className="mt-1 text-lg font-semibold">Rs {formatAmount(totals.balance)}</div></Card>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={downloadCsv} disabled={!filteredRows.length}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx} disabled={!filteredRows.length}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf} disabled={!filteredRows.length}>PDF</Button>
        </div>

        <div className="mt-4">
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  {showOutstanding ? <TableHeader>Outstanding</TableHeader> : null}
                  <TableHeader>Type</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={showOutstanding ? 6 : 5} className="py-4 text-center text-gray-500">Loading...</TableCell>
                  </TableRow>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{row.title || '-'}</TableCell>
                      <TableCell>{row.categoryName || '-'}</TableCell>
                      <TableCell>Rs {formatAmount(row.amount)}</TableCell>
                      {showOutstanding ? <TableCell>Rs {formatAmount(row.outstandingAmount)}</TableCell> : null}
                      <TableCell>{row.type || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showOutstanding ? 6 : 5} className="py-4 text-center text-gray-500">No rows found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableRoot>
          </Table>
        </div>
      </Card>
    </div>
  )
}
