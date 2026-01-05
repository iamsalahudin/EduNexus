"use client"
import { useRef } from 'react'
import { fetchFeesSummary } from '@/services/feesService'
import useSWR from 'swr'
import SubHeader from '@/components/layout/SubHeader'

function toCSV(rows){
  if(!rows || rows.length===0) return ''
  const keys = Object.keys(rows[0])
  const lines = [keys.join(',')].concat(rows.map(r=> keys.map(k=> JSON.stringify(r[k]??'')).join(',')))
  return lines.join('\n')
}

export default function FeeReport(){
  const { data } = useSWR('feesSummary', fetchFeesSummary)
  const sampleRows = [{month:'Jan', collected:12000},{month:'Feb', collected:15000}]
  const csvRef = useRef(null)
  const breadcrumb = [ {id: 1, name: 'Fee', link: '/admin/fees'}, {id: 2, name: 'Fee Report', link: '/admin/fees/report'}]

  function download(){
    const csv = toCSV(sampleRows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fee-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SubHeader breadcrumb={breadcrumb} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fee Report</h1>
          <p className="mt-2 text-sm text-gray-600">Monthly & yearly fee submission tables and analytics.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={download} className="px-3 py-2 btn-primary rounded">Export CSV</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">Monthly submission table (placeholder) — Total Collected: {data?.totalCollected ?? '...'}</div>
        <div className="card">Yearly submission table (placeholder)</div>
      </div>
    </div>
  )
}
