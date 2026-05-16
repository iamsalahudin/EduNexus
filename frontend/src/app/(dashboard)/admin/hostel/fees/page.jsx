'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import hostelService from '@/services/hostelService'

export default function HostelFeesPage() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState({ month: new Date().toISOString().slice(0, 7), status: 'all' })

  async function loadFees() {
    setLoading(true)
    setError('')
    try {
      const data = await hostelService.listFees(filter)
      setFees(Array.isArray(data?.fees) ? data.fees : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFees()
  }, [filter.month, filter.status])

  async function handlePayment(feeId) {
    try {
      await hostelService.payFee(feeId)
      setSuccess('Payment recorded')
      loadFees()
    } catch (err) {
      setError(err?.response?.data?.error || 'Payment failed')
    }
  }

  async function generateMonthlyFees() {
    try {
      await hostelService.createFee({ month: filter.month })
      setSuccess('Monthly fees generated')
      loadFees()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate fees')
    }
  }

  function downloadCsv() {
    const headers = ['Resident', 'Room', 'Month', 'Amount', 'Paid', 'Status']
    const rows = fees.map(f => [
      `${f.resident?.student?.firstName || ''} ${f.resident?.student?.lastName || ''}`.trim(),
      f.resident?.room?.roomNumber || '-',
      `${f.month}/${f.year}`,
      f.amount || 0,
      f.paidAmount || 0,
      f.status || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = `hostel-fees-${filter.month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    try {
      const XLSX = await import('xlsx')
      const payload = fees.map(f => ({
        Resident: `${f.resident?.student?.firstName || ''} ${f.resident?.student?.lastName || ''}`.trim(),
        Room: f.resident?.room?.roomNumber || '-',
        Month: `${f.month}/${f.year}`,
        Amount: f.amount || 0,
        Paid: f.paidAmount || 0,
        Status: f.status || ''
      }))
      const ws = XLSX.utils.json_to_sheet(payload)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'HostelFees')
      const wbOut = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([wbOut], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hostel-fees-${filter.month}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to export XLSX')
    }
  }

  async function downloadPdf() {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      const doc = new jsPDF('portrait', 'pt', 'a4')
      doc.setFontSize(14)
      doc.text('Hostel Fees Report', 40, 40)
      doc.setFontSize(10)
      let y = 70
      fees.forEach((f, i) => {
        const line = `${i + 1}. ${f.resident?.student?.firstName || ''} ${f.resident?.student?.lastName || ''} | ${f.resident?.room?.roomNumber || '-'} | ${f.month}/${f.year} | Rs ${f.amount || 0} | ${f.status || ''}`
        doc.text(line, 40, y)
        y += 16
        if (y > 720) { doc.addPage(); y = 40 }
      })
      doc.save(`hostel-fees-${filter.month}.pdf`)
    } catch (e) {
      setError('Failed to export PDF')
    }
  }

  const visible = filter.status === 'all' ? fees : fees.filter((fee) => fee.status === filter.status)

  return (
    <div className="space-y-6">
      <PageHeader title="Hostel Fees" subtitle="Track and manage hostel payments" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Month</label>
          <Input type="month" value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generateMonthlyFees} variant="outline">Generate Monthly Fees</Button>
          <Button variant="outline" onClick={downloadCsv} disabled={!fees.length}>CSV</Button>
          <Button variant="outline" onClick={downloadXlsx} disabled={!fees.length}>XLSX</Button>
          <Button variant="outline" onClick={downloadPdf} disabled={!fees.length}>PDF</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? <Skeleton className="h-40" /> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-4 font-semibold">Resident</th><th className="px-6 py-4 font-semibold">Month</th><th className="px-6 py-4 font-semibold">Amount</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 font-semibold text-right">Action</th></tr></thead>
            <tbody className="divide-y">
              {visible.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No records found</td></tr> : visible.map((fee) => (<tr key={fee._id}><td className="px-6 py-4"><div className="font-medium">{fee.resident?.student?.firstName} {fee.resident?.student?.lastName}</div><div className="text-xs text-gray-500">{fee.resident?.room?.roomNumber || '-'}</div></td><td className="px-6 py-4">{fee.month}/{fee.year}</td><td className="px-6 py-4">Rs {fee.amount || 0}</td><td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{fee.status}</span></td><td className="px-6 py-4 text-right">{fee.status !== 'paid' && <Button size="sm" onClick={() => handlePayment(fee._id)}>Mark Paid</Button>}</td></tr>))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
