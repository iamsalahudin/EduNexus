"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchFeeDetails, updateFeeStatus } from '@/services/feesService'
import { Button, Card, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from '@/components/ui'

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

  if(!data) return <Card>Loading fee details...</Card>

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
        <Card>
          <h3 className="font-medium">Student Info</h3>
          <ul className="mt-2 text-sm">
            <li>Roll Number: {data.student.roll}</li>
            <li>Name: {data.student.name}</li>
            <li>Father: {data.student.father}</li>
            <li>Class: {data.student.class}</li>
            <li>Section: {data.student.section}</li>
            <li>Gender: {data.student.gender}</li>
          </ul>
        </Card>
        <Card>
          <h3 className="font-medium">Fee Info</h3>
          <ul className="mt-2 text-sm">
            <li>Monthly Fee: {data.feeInfo.monthlyFee}</li>
            <li>Last Payment Date: {data.feeInfo.lastPaymentDate}</li>
            <li>Concession: {data.feeInfo.concession}</li>
            <li>Transport: {data.feeInfo.transport}</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-medium">Last Transactions</h3>
        <div className="mt-3">
          <Table>
            <TableRoot>
              <TableHead>
                <TableRow>
                  <TableHeader>Voucher Date</TableHeader>
                  <TableHeader>Voucher No</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Fee Type</TableHeader>
                  <TableHeader>Total Fee</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Payment Date</TableHeader>
                  <TableHeader></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.transactions.map((t, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{t.voucherDate}</TableCell>
                    <TableCell>{t.voucherNo}</TableCell>
                    <TableCell>{t.dueDate}</TableCell>
                    <TableCell>{t.feeType}</TableCell>
                    <TableCell>{t.totalFee}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell>{t.paymentDate || '-'}</TableCell>
                    <TableCell>
                      {t.status !== 'Paid' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={() => markPaid(t)}
                          disabled={!t?.feeId || savingFeeId === String(t.feeId)}
                          style={{ backgroundColor: 'var(--color-cta)', color: 'var(--color-text-light)' }}
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--color-cta)' }}>Paid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </Table>
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={() => router.push('/admin/fees/voucher')}>Open Voucher Settings</Button>
          <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copy Link
          </Button>
        </div>
      </Card>
    </div>
  )
}

