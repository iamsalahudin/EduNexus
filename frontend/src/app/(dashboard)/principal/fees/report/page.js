"use client"
import { useRef } from 'react'
import { fetchFeesSummary } from '@/services/feesService'
import useSWR from 'swr'
import { Button, PageHeader } from '@/components/ui'

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
      <PageHeader
        title="Fee Report"
        subtitle="Monthly & yearly fee submission tables and analytics."
        right={(
          <Button variant="primary" onClick={download}>Export CSV</Button>
        )}
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">Monthly submission table (placeholder) — Total Collected: {data?.totalCollected ?? '...'}</div>
        <div className="card">Yearly submission table (placeholder)</div>
      </div>
    </div>
  )
}
