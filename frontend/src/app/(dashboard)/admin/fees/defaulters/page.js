"use client"
import { useEffect, useState } from 'react'
import FilterForm from '@/components/fees/FilterForm'
import FeesTable from '@/components/fees/FeesTable'
import { fetchFeeDefaulters } from '@/services/feesService'

export default function FeeDefaulters(){
  const [filters, setFilters] = useState({})
  const [masterRows, setMasterRows] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadAll(){
    setLoading(true)
    const res = await fetchFeeDefaulters({})
    setMasterRows(res)
    setRows(res)
    setLoading(false)
  }

  useEffect(()=>{ loadAll() },[])

  // apply client-side filters whenever filters or masterRows change
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
    { key:'feeType', label:'Fee Type' },
    { key:'pendingFee', label:'Pending Fee' }
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fee Defaulters</h1>
      <FilterForm initial={{}} monthAsNumber={true} yearMax={new Date().getFullYear()} onApply={(f)=>{ setFilters(f) }} />
      {loading ? <div className="mt-4">Loading...</div> : <FeesTable columns={columns} data={rows} />}
    </div>
  )
}
