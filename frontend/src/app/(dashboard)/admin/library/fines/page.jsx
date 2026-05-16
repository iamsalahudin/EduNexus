'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import libraryService from '@/services/libraryService'

export default function FinesPage() {
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [payAmount, setPayAmount] = useState({})

  async function loadFines() {
    setLoading(true)
    setError('')
    try {
      const res = await libraryService.listFines()
      setFines(Array.isArray(res?.fines) ? res.fines : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFines()
  }, [])

  async function payFine(fineId) {
    const amount = payAmount[fineId]
    if (!amount || Number(amount) <= 0) {
      setError('Enter valid amount')
      return
    }
    try {
      await libraryService.payFine(fineId, { amount: Number(amount) })
      setSuccess('Fine paid')
      setPayAmount({ ...payAmount, [fineId]: '' })
      loadFines()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to pay')
    }
  }

  const pending = fines.filter((fine) => fine.status !== 'paid')
  const totalPending = pending.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Library Fines" subtitle="Fine tracking and payment" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="text-2xl font-bold">{pending.length}</div><div className="text-sm text-gray-600">Pending Fines</div></Card>
        <Card><div className="text-2xl font-bold">Rs {totalPending.toFixed(2)}</div><div className="text-sm text-gray-600">Total Pending</div></Card>
        <Card><div className="text-2xl font-bold">{fines.length}</div><div className="text-sm text-gray-600">All Fines</div></Card>
      </div>

      <Card>
        {loading ? <Skeleton className="h-40" /> : fines.length === 0 ? <div className="text-sm text-gray-600">No fines.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 px-3 text-left">Student</th><th className="py-2 px-3 text-left">Book</th><th className="py-2 px-3">Amount</th><th className="py-2 px-3">Paid</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Action</th></tr></thead>
              <tbody>{fines.map((fine) => (<tr key={fine._id} className="border-b"><td className="py-2 px-3">{fine.student?.firstName} {fine.student?.lastName}</td><td className="py-2 px-3 text-sm">{fine.issue?.book?.title || 'N/A'}</td><td className="py-2 px-3 text-center">Rs {fine.fineAmount || 0}</td><td className="py-2 px-3 text-center">Rs {fine.finePaidAmount || 0}</td><td className="py-2 px-3 text-center text-xs"><span className={`px-2 py-1 rounded ${fine.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{fine.status}</span></td><td className="py-2 px-3">{fine.status !== 'paid' && <div className="flex gap-1 items-center text-xs"><Input type="number" min="0.01" placeholder="Amount" value={payAmount[fine._id] || ''} onChange={(e) => setPayAmount({ ...payAmount, [fine._id]: e.target.value })} className="w-20 h-7" /><Button size="sm" onClick={() => payFine(fine._id)}>Pay</Button></div>}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
