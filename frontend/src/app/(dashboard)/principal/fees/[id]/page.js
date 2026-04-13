"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchFeeDetails, updateFeeStatus } from '@/services/feesService'
import { Button, PageHeader } from '@/components/ui'

export default function FeeDetails(){
  const params = useParams()
  const id = params.id
  const router = useRouter()
  const [data, setData] = useState(null)
  const [savingFeeId, setSavingFeeId] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{
    let mounted = true
    fetchFeeDetails(id).then(d=>{ if(mounted) setData(d) })
    return ()=> mounted = false
  },[id])

  if(!data) return <div className="card">Loading fee details...</div>

  async function markPaid(transaction) {
    if (!transaction?.feeId) return
    setSavingFeeId(String(transaction.feeId))
    setError('')
    try {
      await updateFeeStatus(transaction.feeId, 'paid')
      const refreshed = await fetchFeeDetails(id)
      setData(refreshed)
    } catch {
      setError('Unable to update fee status.')
    } finally {
      setSavingFeeId('')
    }
  }

  return (
    <div>
      <PageHeader title={`Fee Details — ${data.student.name}`} />
      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium">Student Info</h3>
          <ul className="mt-2 text-sm">
            <li>Roll Number: {data.student.roll}</li>
            <li>Name: {data.student.name}</li>
            <li>Father: {data.student.father}</li>
            <li>Class: {data.student.class}</li>
            <li>Section: {data.student.section}</li>
            <li>Gender: {data.student.gender}</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-medium">Fee Info</h3>
          <ul className="mt-2 text-sm">
            <li>Monthly Fee: {data.feeInfo.monthlyFee}</li>
            <li>Last Payment Date: {data.feeInfo.lastPaymentDate}</li>
            <li>Concession: {data.feeInfo.concession}</li>
            <li>Transport: {data.feeInfo.transport}</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium">Last Transactions</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left table-auto">
            <thead>
              <tr>
                <th className="px-3 py-2">Voucher Date</th>
                <th className="px-3 py-2">Voucher No</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2">Fee Type</th>
                <th className="px-3 py-2">Total Fee</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment Date</th>
              </tr>
            </thead>
            <tbody>
                {data.transactions.map((t,idx)=> (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{t.voucherDate}</td>
                    <td className="px-3 py-2">{t.voucherNo}</td>
                    <td className="px-3 py-2">{t.dueDate}</td>
                    <td className="px-3 py-2">{t.feeType}</td>
                    <td className="px-3 py-2">{t.totalFee}</td>
                    <td className="px-3 py-2">{t.status}</td>
                    <td className="px-3 py-2">{t.paymentDate || '-'}</td>
                    <td className="px-3 py-2">
                      {t.status !== 'Paid' ? (
                        <Button
                          size="sm"
                          onClick={() => markPaid(t)}
                          disabled={!t?.feeId || savingFeeId === String(t.feeId)}
                          className="text-sm"
                          style={{ backgroundColor: 'var(--color-cta)', color: 'var(--color-text-light)' }}
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-sm" style={{color: 'var(--color-cta)'}}>Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => router.push('/principal/fees/report')}>Back to Reports</Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Link</Button>
          </div>
        </div>
    </div>
  )
}

