"use client"
import { useEffect, useMemo, useState } from 'react'
import { fetchFeesSummary } from '@/services/feesService'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'

export default function FeesHome(){
  const [summary, setSummary] = useState(null)

  useEffect(()=>{
    let mounted = true
    fetchFeesSummary().then(s=>{ if(mounted) setSummary(s) })
    return ()=> mounted = false
  },[])

  const chartData = useMemo(()=>{
    if(!summary) return []
    // mock monthly series
    return Array.from({length:6}).map((_,i)=>({ name: `M-${i+1}`, collected: Math.floor(summary.totalCollected/6) + (i*1000) }))
  },[summary])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fees</h1>
      <p className="text-sm text-gray-600 mt-1">Overview of fee collections and quick actions.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">Total Students<br/>{summary? summary.totalStudents : '...'}</div>
        <div className="card">Paid This Month<br/>{summary? summary.paidThisMonth : '...'}</div>
        <div className="card">Pending Count<br/>{summary? summary.pendingCount : '...'}</div>
        <div className="card">Total Collected<br/>{summary? `Rs ${summary.totalCollected}` : '...'}</div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium">Monthly Collection</h3>
          <div className="h-48 mt-3">
            {!summary ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', color: 'var(--color-text)'}} labelStyle={{color: 'var(--color-text)'}} itemStyle={{color: 'var(--color-text)'}} />
                  <Line type="monotone" dataKey="collected" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card">Recent Transactions placeholder</div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/admin/fees/defaulters" className="px-3 py-2 rounded btn-secondary">Fee Defaulters</Link>
        <Link href="/admin/fees/record" className="px-3 py-2 rounded btn-secondary">Fee Record</Link>
        <Link href="/admin/fees/voucher" className="px-3 py-2 rounded btn-secondary">Fee Voucher</Link>
        <Link href="/admin/fees/structure" className="px-3 py-2 rounded btn-secondary">Fee Structure</Link>
        <Link href="/admin/fees/report" className="px-3 py-2 rounded btn-secondary">Fee Report</Link>
      </div>
    </div>
  )
}

