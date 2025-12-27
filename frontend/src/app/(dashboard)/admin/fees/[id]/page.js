"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SubHeader from '@/components/layout/SubHeader'
import { fetchFeeDetails } from '@/services/feesService'

export default function FeeDetails(){
  const params = useParams()
  const id = params.id
  const router = useRouter()
  const [data, setData] = useState(null)

  useEffect(()=>{
    let mounted = true
    fetchFeeDetails(id).then(d=>{ if(mounted) setData(d) })
    return ()=> mounted = false
  },[id])

  if(!data) return <div className="card">Loading fee details...</div>

  function markPaid(index){
    setData(prev=>{
      const copy = { ...prev, transactions: prev.transactions.map((t,i)=> i===index ? { ...t, status:'Paid', paymentDate: new Date().toISOString().slice(0,10) } : t ) }
      return copy
    })
  }

  function generateVoucher(){
    // mock voucher generation
    alert('Voucher generated (mock)')
  }

  return (
    <div>
      <SubHeader breadcrumb={[ 'Fee', 'Fee Defaulters', `Fee Details (${id})` ]} />

      <h1 className="text-2xl font-semibold">Fee Details — {data.student.name}</h1>
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
                        <button onClick={()=>markPaid(idx)} className="px-2 py-1 rounded text-sm" style={{backgroundColor: 'var(--color-cta)', color: 'var(--color-text-light)'}}>Mark Paid</button>
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
            <button onClick={generateVoucher} className="px-3 py-2 border rounded hover-theme-primary">Generate Voucher</button>
            <button onClick={()=>navigator.clipboard.writeText(window.location.href)} className="px-3 py-2 border rounded">Copy Link</button>
          </div>
        </div>
    </div>
  )
}
