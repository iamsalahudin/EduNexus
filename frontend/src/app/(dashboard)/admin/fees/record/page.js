"use client"
import { useEffect, useState } from 'react'
import FilterForm from '@/components/fees/FilterForm'
import FeesTable from '@/components/fees/FeesTable'
import { fetchFeeRecords } from '@/services/feesService'
import { Button, Card, EmptyState, PageHeader } from '@/components/ui'

function toCSV(rows){
  if(!rows || rows.length===0) return ''
  const keys = Object.keys(rows[0])
  const lines = [keys.join(',')].concat(rows.map(r=> keys.map(k=> JSON.stringify(r[k]??'')).join(',')))
  return lines.join('\n')
}

export default function FeeRecord(){
  const [filters, setFilters] = useState({})
  const [masterRows, setMasterRows] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadAll(){
    setLoading(true)
    const res = await fetchFeeRecords({})
    setMasterRows(res)
    setRows(res)
    setLoading(false)
  }

  useEffect(()=>{ loadAll() },[])

  useEffect(()=>{
    if(!masterRows) return
    const f = filters || {}
    const out = masterRows.filter(row => {
      for(const k of Object.keys(f)){
        const v = f[k]
        if(!v) continue
        const rv = (row[k] ?? '') + ''
        const vv = (v + '').toLowerCase()
        if(k === 'month' || k === 'year'){
          if(rv !== vv && rv.indexOf(vv) === -1) return false
        } else {
          if(rv.toLowerCase().indexOf(vv) === -1) return false
        }
      }
      return true
    })
    setRows(out)
  },[filters, masterRows])

  const columns = [
    { key:'roll', label:'Roll No' },
    { key:'name', label:'Name' },
    { key:'father', label:'Father Name' },
    { key:'class', label:'Class' },
    { key:'section', label:'Section' },
    { key:'gender', label:'Gender' },
    { key:'lastPaymentDate', label:'Last Payment Date' },
    { key:'monthlyFee', label:'Monthly Fee' }
  ]

  return (
    <div>
      <PageHeader title="Fee Record" />
      <FilterForm initial={{}} monthAsNumber={true} yearMax={new Date().getFullYear()} onApply={(f)=>{ setFilters(f) }} />
      {loading ? <div className="mt-4">Loading...</div> : (
        <div>
          {rows.length===0 ? <EmptyState title="No records" description="No fee records found for the selected filters." /> : (
            <div>
              <div className="flex items-center justify-end gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const csv = toCSV(rows)
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'fee-records.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Export CSV
                </Button>
              </div>
              <Card>
                <FeesTable columns={columns} data={rows} />
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
