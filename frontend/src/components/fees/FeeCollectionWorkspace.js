'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchFeeRecords, updateFeeStatus } from '@/services/feesService'
import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow
} from '@/components/ui'

const DEFAULT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' }
]

const RECEPTION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'all', label: 'All' }
]

export default function FeeCollectionWorkspace({
  title = 'Fee Collection',
  subtitle = 'Manage monthly fee payment status and quickly locate student fee entries.',
  defaultStatus = 'all',
  allowPendingToggle = true,
  note
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(defaultStatus)

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

  const statusOptions = allowPendingToggle ? DEFAULT_STATUS_OPTIONS : RECEPTION_STATUS_OPTIONS

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      <Card>
        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by roll, name, class, section" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
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
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Roll</TableHeader>
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Class</TableHeader>
                  <TableHeader className="text-right">Monthly Fee</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell>{row.roll}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.class} - {row.section}</TableCell>
                    <TableCell className="text-right">Rs {row.monthlyFee}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => markStatus(row, 'Paid')}
                          disabled={savingId === String(row.feeId) || row.status === 'Paid'}
                        >
                          Mark Paid
                        </Button>
                        {allowPendingToggle ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => markStatus(row, 'Pending')}
                            disabled={savingId === String(row.feeId)}
                          >
                            Mark Pending
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </Table>
        )}
      </Card>

      {note ? (
        <div className="text-xs text-gray-500">{note}</div>
      ) : null}
    </div>
  )
}
