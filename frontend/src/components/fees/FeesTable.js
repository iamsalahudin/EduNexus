<<<<<<< HEAD
"use client"
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FeesTable({ columns = [], data = [], perPage = 10, detailBasePath = '/admin/fees' }){
  const router = useRouter()
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(()=>{
    if(!sortKey) return data
    const out = [...data].sort((a,b)=>{
      if(a[sortKey] < b[sortKey]) return sortDir === 'asc' ? -1 : 1
      if(a[sortKey] > b[sortKey]) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return out
  },[data, sortKey, sortDir])

  const paged = useMemo(()=>{
    const start = (page-1)*perPage
    return sorted.slice(start, start+perPage)
  },[sorted, page, perPage])

  function headerClick(key){
    if(sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))

  return (
    <div className="overflow-x-auto card relative">
      <table className="w-full text-left table-auto">
        <thead>
          <tr>
            {columns.map(col=> (
              <th
                key={col.key}
                className="px-3 py-2 text-sm font-medium cursor-pointer"
                onClick={()=>headerClick(col.key)}
                style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'var(--card-bg)', borderBottom: '1px solid rgba(0,0,0,0.06)'}}
              >
                {col.label} {sortKey===col.key ? (sortDir==='asc' ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map(row=> (
            <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>router.push(`${detailBasePath}/${row.id}`)}>
              {columns.map(col=> <td key={col.key} className="px-3 py-2 text-sm">{row[col.key]}</td>)}
            </tr>
          ))}
          {paged.length===0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-gray-500">No records found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
          <button className="px-2 py-1 border rounded" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
        </div>
      </div>
    </div>
  )
}
=======
"use client"
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FeesTable({ columns = [], data = [], perPage = 10, detailBasePath = '/admin/fees' }){
  const router = useRouter()
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(()=>{
    if(!sortKey) return data
    const out = [...data].sort((a,b)=>{
      if(a[sortKey] < b[sortKey]) return sortDir === 'asc' ? -1 : 1
      if(a[sortKey] > b[sortKey]) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return out
  },[data, sortKey, sortDir])

  const paged = useMemo(()=>{
    const start = (page-1)*perPage
    return sorted.slice(start, start+perPage)
  },[sorted, page, perPage])

  function headerClick(key){
    if(sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))

  return (
    <div className="overflow-x-auto card relative">
      <table className="w-full text-left table-auto">
        <thead>
          <tr>
            {columns.map(col=> (
              <th
                key={col.key}
                className="px-3 py-2 text-sm font-medium cursor-pointer"
                onClick={()=>headerClick(col.key)}
                style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'var(--card-bg)', borderBottom: '1px solid rgba(0,0,0,0.06)'}}
              >
                {col.label} {sortKey===col.key ? (sortDir==='asc' ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map(row=> (
            <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>router.push(`${detailBasePath}/${row.id}`)}>
              {columns.map(col=> <td key={col.key} className="px-3 py-2 text-sm">{row[col.key]}</td>)}
            </tr>
          ))}
          {paged.length===0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-gray-500">No records found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
          <button className="px-2 py-1 border rounded" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
        </div>
      </div>
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
