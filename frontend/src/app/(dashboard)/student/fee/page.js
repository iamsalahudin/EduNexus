<<<<<<< HEAD
"use client"
import { useEffect, useMemo, useState } from 'react'
import { fetchFeeDetails } from '@/services/feesService'
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

function normalizeTransactionRows(transactions = []) {
  return transactions.map((row) => ({
    voucherDate: row?.voucherDate || '',
    voucherNo: row?.voucherNo || '',
    dueDate: row?.dueDate || '',
    feeType: row?.feeType || '',
    amount: Number(row?.totalFee || 0),
    status: row?.status || ''
  }))
}

export default function Page() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this-year')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const queryParams = useMemo(() => {
    if (period === 'custom') {
      return {
        period,
        from: fromDate || undefined,
        to: toDate || undefined
      }
    }
    return { period }
  }, [period, fromDate, toDate])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchFeeDetails('self', queryParams).then((res) => {
      if (mounted) setData(res)
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [queryParams])

  const transactions = useMemo(() => Array.isArray(data?.transactions) ? data.transactions : [], [data])
  const summary = data?.summary || {}
  const monthlyRows = Array.isArray(summary?.monthlyRows) ? summary.monthlyRows : []
  const yearlyRows = Array.isArray(summary?.yearlyRows) ? summary.yearlyRows : []

  const totals = summary?.totals || { paid: 0, due: 0, total: 0 }

  function downloadCsv() {
    const rows = normalizeTransactionRows(transactions)
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-fee-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(normalizeTransactionRows(transactions))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FeeTransactions')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-fee-transactions.xlsx'
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
      pdf.text('Student Fee Report', 40, 40)
      pdf.setFontSize(10)
      let y = 64
      normalizeTransactionRows(transactions).forEach((row) => {
        pdf.text(`${row.voucherDate} | ${row.voucherNo} | ${row.feeType} | Rs ${row.amount} | ${row.status}`, 40, y)
        y += 16
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save('student-fee-transactions.pdf')
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Fee Details"
          subtitle="View paid and due fee with monthly and yearly summary tables."
        />
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={downloadCsv}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </Select>
          {period === 'custom' ? (
            <>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          ) : (
            <div className="text-sm text-gray-600 flex items-center">
              Showing: {summary?.period?.from || 'All'} {summary?.period?.to ? `to ${summary.period.to}` : ''}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Paid Fee</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.paid || 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Due Fee</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.due || 0}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Monthly Paid and Due</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Month</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map((row) => (
              <tr key={row.period} className="border-b last:border-none">
                <td className="py-2">{row.period}</td>
                <td className="text-right">Rs {row.paid || 0}</td>
                <td className="text-right">Rs {row.due || 0}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="text-right">Rs {monthlyRows.reduce((s, r) => s + r.paid, 0)}</td>
              <td className="text-right">Rs {monthlyRows.reduce((s, r) => s + r.due, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Yearly Paid and Due</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Year</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {yearlyRows.map((row) => (
              <tr key={row.period} className="border-b last:border-none">
                <td className="py-2">{row.period}</td>
                <td className="text-right">Rs {row.paid || 0}</td>
                <td className="text-right">Rs {row.due || 0}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="text-right">Rs {yearlyRows.reduce((s, r) => s + r.paid, 0)}</td>
              <td className="text-right">Rs {yearlyRows.reduce((s, r) => s + r.due, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Transactions</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Voucher Date</th>
                <th className="text-left">Voucher #</th>
                <th className="text-left">Due Date</th>
                <th className="text-left">Type</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-4 text-sm text-gray-500" colSpan={6}>Loading...</td></tr>
              ) : transactions.map((row) => (
                <tr key={`${row.voucherNo}-${row.feeId}`} className="border-b last:border-none">
                  <td className="py-2">{row.voucherDate || '—'}</td>
                  <td>{row.voucherNo || '—'}</td>
                  <td>{row.dueDate || '—'}</td>
                  <td>{row.feeType || '—'}</td>
                  <td className="text-right">Rs {row.totalFee || 0}</td>
                  <td>{row.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
=======
"use client"
import { useEffect, useMemo, useState } from 'react'
import { fetchFeeDetails } from '@/services/feesService'
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

function normalizeTransactionRows(transactions = []) {
  return transactions.map((row) => ({
    voucherDate: row?.voucherDate || '',
    voucherNo: row?.voucherNo || '',
    dueDate: row?.dueDate || '',
    feeType: row?.feeType || '',
    amount: Number(row?.totalFee || 0),
    status: row?.status || ''
  }))
}

export default function Page() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this-year')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const queryParams = useMemo(() => {
    if (period === 'custom') {
      return {
        period,
        from: fromDate || undefined,
        to: toDate || undefined
      }
    }
    return { period }
  }, [period, fromDate, toDate])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchFeeDetails('self', queryParams).then((res) => {
      if (mounted) setData(res)
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [queryParams])

  const transactions = useMemo(() => Array.isArray(data?.transactions) ? data.transactions : [], [data])
  const summary = data?.summary || {}
  const monthlyRows = Array.isArray(summary?.monthlyRows) ? summary.monthlyRows : []
  const yearlyRows = Array.isArray(summary?.yearlyRows) ? summary.yearlyRows : []

  const totals = summary?.totals || { paid: 0, due: 0, total: 0 }

  function downloadCsv() {
    const rows = normalizeTransactionRows(transactions)
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-fee-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(normalizeTransactionRows(transactions))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'FeeTransactions')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-fee-transactions.xlsx'
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
      pdf.text('Student Fee Report', 40, 40)
      pdf.setFontSize(10)
      let y = 64
      normalizeTransactionRows(transactions).forEach((row) => {
        pdf.text(`${row.voucherDate} | ${row.voucherNo} | ${row.feeType} | Rs ${row.amount} | ${row.status}`, 40, y)
        y += 16
        if (y > 760) {
          pdf.addPage()
          y = 40
        }
      })
      pdf.save('student-fee-transactions.pdf')
    } catch {
      downloadCsv()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Fee Details"
          subtitle="View paid and due fee with monthly and yearly summary tables."
        />
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={downloadCsv}>CSV</Button>
          <Button type="button" variant="outline" onClick={downloadXlsx}>XLSX</Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </Select>
          {period === 'custom' ? (
            <>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          ) : (
            <div className="text-sm text-gray-600 flex items-center">
              Showing: {summary?.period?.from || 'All'} {summary?.period?.to ? `to ${summary.period.to}` : ''}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Paid Fee</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.paid || 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Due Fee</div>
          <div className="text-xl font-semibold mt-1">Rs {totals.due || 0}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Monthly Paid and Due</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Month</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map((row) => (
              <tr key={row.period} className="border-b last:border-none">
                <td className="py-2">{row.period}</td>
                <td className="text-right">Rs {row.paid || 0}</td>
                <td className="text-right">Rs {row.due || 0}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="text-right">Rs {monthlyRows.reduce((s, r) => s + r.paid, 0)}</td>
              <td className="text-right">Rs {monthlyRows.reduce((s, r) => s + r.due, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Yearly Paid and Due</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Year</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {yearlyRows.map((row) => (
              <tr key={row.period} className="border-b last:border-none">
                <td className="py-2">{row.period}</td>
                <td className="text-right">Rs {row.paid || 0}</td>
                <td className="text-right">Rs {row.due || 0}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="text-right">Rs {yearlyRows.reduce((s, r) => s + r.paid, 0)}</td>
              <td className="text-right">Rs {yearlyRows.reduce((s, r) => s + r.due, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-medium mb-3">Transactions</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Voucher Date</th>
                <th className="text-left">Voucher #</th>
                <th className="text-left">Due Date</th>
                <th className="text-left">Type</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-4 text-sm text-gray-500" colSpan={6}>Loading...</td></tr>
              ) : transactions.map((row) => (
                <tr key={`${row.voucherNo}-${row.feeId}`} className="border-b last:border-none">
                  <td className="py-2">{row.voucherDate || '—'}</td>
                  <td>{row.voucherNo || '—'}</td>
                  <td>{row.dueDate || '—'}</td>
                  <td>{row.feeType || '—'}</td>
                  <td className="text-right">Rs {row.totalFee || 0}</td>
                  <td>{row.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
