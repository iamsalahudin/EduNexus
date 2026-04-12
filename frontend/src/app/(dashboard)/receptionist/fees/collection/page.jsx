'use client'
import { useEffect, useMemo, useState } from 'react'
import { fetchFeeRecords, updateFeeStatus } from '@/services/feesService'
import { Button, Card, Input, PageHeader, Select } from '@/components/ui'

export default function FeeCollectionPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    let mounted = true
    fetchFeeRecords({})
      .then((res) => {
        if (!mounted) return
        setRows(Array.isArray(res) ? res : [])
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setRows([])
        setError('Unable to load fee records.')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const text = `${r?.roll || ''} ${r?.name || ''} ${r?.class || ''} ${r?.section || ''}`.toLowerCase()
      const queryOk = !query.trim() || text.includes(query.trim().toLowerCase())
      const statusOk = status === 'all' || String(r?.status || '').toLowerCase() === status
      return queryOk && statusOk
    })
  }, [rows, query, status])

  async function markPaid(row) {
    if (!row?.feeId) return
    setSavingId(String(row.feeId))
    setError('')
    try {
      await updateFeeStatus(row.feeId, 'paid')
      setRows((prev) => prev.map((r) => (r.feeId === row.feeId ? { ...r, status: 'Paid' } : r)))
    } catch {
      setError('Unable to mark fee as paid.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Collection"
        subtitle="Mark auto-generated monthly student fee as paid or keep unpaid status."
      />

      <Card>
        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student by roll, name, class" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="all">All</option>
          </Select>
          <div className="text-sm text-gray-600 flex items-center">Amount fields are read-only for receptionist.</div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-sm text-gray-500">Loading rows...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Roll</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Class</th>
                  <th className="text-right">Monthly Fee</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-none">
                    <td className="py-2">{row.roll}</td>
                    <td>{row.name}</td>
                    <td>{row.class} - {row.section}</td>
                    <td className="text-right">Rs {row.monthlyFee}</td>
                    <td>{row.status}</td>
                    <td className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => markPaid(row)}
                        disabled={row.status === 'Paid' || savingId === String(row.feeId)}
                      >
                        Mark Paid
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="text-xs text-gray-500">
        Reception workflow does not allow editing fee amount; only status update is permitted.
      </div>
    </div>
  )
}
