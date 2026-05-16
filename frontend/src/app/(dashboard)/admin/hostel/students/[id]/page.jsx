'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import hostelService from '@/services/hostelService'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function getResidentName(resident) {
  return resident?.student?.user?.name || resident?.student?.name || resident?.student?.studentId || 'Student'
}

function getStatusClass(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'active') return 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200'
  if (value === 'left' || value === 'inactive') return 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200'
  return 'inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200'
}

export default function HostelStudentDetailPage({ params }) {
  const [resident, setResident] = useState(null)
  const [fees, setFees] = useState([])
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadResident() {
      try {
        setLoading(true)
        setError('')
        const res = await hostelService.getResidentById(params?.id)
        if (!mounted) return
        setResident(res?.resident || null)
        setFees(Array.isArray(res?.fees) ? res.fees : [])
        setSummary(res?.summary || { total: 0, paid: 0, pending: 0 })
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || 'Failed to load resident details')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadResident()
    return () => {
      mounted = false
    }
  }, [params?.id])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Student"
        subtitle="View hostel allocation details, room information, and fee records."
        right={resident ? <Button asChild><Link href={`/admin/hostel/students/${resident._id}/edit`}>Edit Allocation</Link></Button> : null}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <Skeleton className="h-40" />
      ) : resident ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{getResidentName(resident)}</h2>
              <p className="text-sm text-slate-500">{resident.student?.studentId}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Hostel</div><div className="mt-1 font-medium">{resident.hostel?.name || '-'}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Room</div><div className="mt-1 font-medium">{resident.room?.roomNumber || '-'}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Join Date</div><div className="mt-1 font-medium">{formatDate(resident.joinDate)}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Status</div><div className="mt-2"><span className={getStatusClass(resident.status)}>{resident.status || '-'}</span></div></div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">Notes</div>
              <p className="mt-1">{resident.notes || 'No notes.'}</p>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Fee summary</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Total</div><div className="mt-1 font-medium">Rs {Number(summary.total || 0).toLocaleString()}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Paid</div><div className="mt-1 font-medium">Rs {Number(summary.paid || 0).toLocaleString()}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Pending</div><div className="mt-1 font-medium">Rs {Number(summary.pending || 0).toLocaleString()}</div></div>
            </div>

            <div className="space-y-3 max-h-[26rem] overflow-auto pr-1">
              {fees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No hostel fee records yet.</div>
              ) : (
                fees.map((fee) => (
                  <div key={fee._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{fee.month}/{fee.year}</div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 capitalize">{fee.status}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>Amount: Rs {Number(fee.amount || 0).toLocaleString()}</div>
                      <div>Paid: Rs {Number(fee.paidAmount || 0).toLocaleString()}</div>
                      <div>Due: {formatDate(fee.dueDate)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-sm text-slate-600">Resident not found.</Card>
      )}
    </div>
  )
}