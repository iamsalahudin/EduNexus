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
  const [status, setStatus] = useState('all')

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

  async function markStatus(row, nextStatus) {
    if (!row?.feeId) return
    setSavingId(String(row.feeId))
    setError('')
    try {
      await updateFeeStatus(row.feeId, nextStatus.toLowerCase())
      setRows((prev) => prev.map((r) => (r.feeId === row.feeId ? { ...r, status: nextStatus } : r)))
    } catch {
      setError('Unable to update fee status.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Collection"
        subtitle="Manage monthly fee payment status and quickly locate student fee entries."
      />

      <Card>
        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by roll, name, class, section" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </Select>
          <div className="flex gap-2 items-center text-sm text-gray-600">
            <span>Records:</span>
            <span className="font-semibold text-gray-900">{filteredRows.length}</span>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-sm text-gray-500">Loading fee collection rows...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Roll</th>
                  <th className="text-left">Student</th>
                  <th className="text-left">Class</th>
                  <th className="text-right">Monthly Fee</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Actions</th>
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
                      <div className="inline-flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => markStatus(row, 'Paid')}
                          disabled={savingId === String(row.feeId)}
                        >
                          Mark Paid
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => markStatus(row, 'Pending')}
                          disabled={savingId === String(row.feeId)}
                        >
                          Mark Pending
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="text-xs text-gray-500">
        Collection updates are persisted to the backend fee records.
      </div>
    </div>
  )
}
