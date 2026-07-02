"use client"
import { useEffect, useMemo, useState } from 'react'
import { fetchFeesSummary } from '@/services/feesService'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Link from 'next/link'

export default function AdminDashboard(){
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(()=>{
    let mounted = true
    fetchFeesSummary().then(s=>{ if(mounted) setSummary(s) })
    // mock recent activities
    setRecent([
      { id:1, text:'Voucher V-1001 generated', time:'2h ago' },
      { id:2, text:'Payment received R-1002', time:'6h ago' },
      { id:3, text:'New student added R-1010', time:'1d ago' }
    ])
    return ()=> mounted = false
  },[])

  const chartData = useMemo(()=>{
    if(!summary) return []
    return Array.from({length:6}).map((_,i)=>({ name:`M-${i+1}`, value: Math.floor(summary.totalCollected/6) + i*1000 }))
  },[summary])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Overview of institute operations and quick actions.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/fees" className="px-3 py-2 btn-primary rounded">Fees</Link>
          <Link href="/admin/attendance" className="px-3 py-2 border rounded">Attendance</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Total Students</div>
          <div className="mt-2 text-2xl font-semibold">{summary ? summary.totalStudents : <Skeleton className="inline-block w-24 h-6"/>}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Paid This Month</div>
          <div className="mt-2 text-2xl font-semibold">{summary ? summary.paidThisMonth : <Skeleton className="inline-block w-24 h-6"/>}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Pending Count</div>
          <div className="mt-2 text-2xl font-semibold">{summary ? summary.pendingCount : <Skeleton className="inline-block w-24 h-6"/>}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total Collected</div>
          <div className="mt-2 text-2xl font-semibold">{summary ? `Rs ${summary.totalCollected}` : <Skeleton className="inline-block w-28 h-6"/>}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2">
          <h3 className="font-medium">Collections (last 6 months)</h3>
          <div className="mt-3 h-48">
            {!summary ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', color: 'var(--color-text)'}} labelStyle={{color: 'var(--color-text)'}} itemStyle={{color: 'var(--color-text)'}} />
                  <Line dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium">Recent Activity</h3>
          <div className="mt-3 space-y-2">
            {recent.length===0 ? <EmptyState title="No recent activity" /> : (
              recent.map(item=> (
                <div key={item.id} className="text-sm border-b pb-2">
                  <div className="font-medium">{item.text}</div>
                  <div className="text-xs text-gray-500">{item.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
