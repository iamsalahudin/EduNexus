"use client"
import { useRef } from 'react'
import { fetchFeesSummary } from '@/services/feesService'
import useSWR from 'swr'
import { Button, Card, PageHeader } from '@/components/ui'

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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Fee Report"
          subtitle="Monthly & yearly fee submission tables and analytics."
        />
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={download}>Export CSV</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>Monthly submission table (placeholder) — Total Collected: {data?.totalCollected ?? '...'}</Card>
        <Card>Yearly submission table (placeholder)</Card>
      </div>
    </div>
  )
}
