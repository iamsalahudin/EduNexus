'use client'

import React, { useState, useEffect } from 'react'
import { addMinutes, toMinutes } from '@/utils/time'

export default function TimeSlotBuilder({ onChange }) {
  const [rows, setRows] = useState([
    // initial example
    { start: '08:00', duration: 30 },
    { start: '08:30', duration: 30 },
  ])
  const [startInput, setStartInput] = useState('09:00')
  const [durationInput, setDurationInput] = useState('30')

  useEffect(()=> {
    // build canonical list with end & label sorted
    const built = rows.map(r => {
      const end = addMinutes(r.start, Number(r.duration))
      return { start: r.start, duration: Number(r.duration), end, label: `${r.start} - ${end}`, key: `${r.start}_${r.duration}` }
    }).sort((a,b)=>toMinutes(a.start)-toMinutes(b.start))
    onChange(built)
  }, [rows, onChange])

  function addRow() {
    // validate format HH:MM
    if (!/^\d{2}:\d{2}$/.test(startInput)) return
    const dur = Number(durationInput)
    if (!dur || dur <= 0) return
    setRows(prev => [...prev, { start: startInput, duration: dur }])
  }

  function removeRow(idx) {
    setRows(prev => prev.filter((_,i)=>i!==idx))
  }

  function updateRow(idx, field, val) {
    setRows(prev => prev.map((r,i)=> i===idx ? {...r, [field]: val} : r))
  }

  return (
    <div className="card">
      <label className="text-sm font-medium">Time slots (rows)</label>

      <div className="mt-3 space-y-3">
        {rows.map((r, idx) => {
          const end = addMinutes(r.start, Number(r.duration))
          return (
            <div key={idx} className="flex items-center gap-2">
              <input className="input w-24" value={r.start} onChange={(e)=>updateRow(idx,'start',e.target.value)} />
              <input className="input w-20" value={String(r.duration)} onChange={(e)=>updateRow(idx,'duration',e.target.value)} />
              <div className="text-sm text-gray-600 w-36">{r.start} - {end}</div>
              <button onClick={()=>removeRow(idx)} className="px-2 py-1 border rounded text-sm">Remove</button>
            </div>
          )
        })}

        <div className="flex items-center gap-2 mt-2">
          <input className="input w-24" value={startInput} onChange={(e)=>setStartInput(e.target.value)} placeholder="HH:MM" />
          <input className="input w-20" value={durationInput} onChange={(e)=>setDurationInput(e.target.value)} placeholder="mins" />
          <button onClick={addRow} className="px-3 py-2 border rounded">+ Add slot</button>
          <div className="text-xs text-gray-500 ml-3">
            Times will be auto-sorted top → bottom. Use 24h HH:MM format.
          </div>
        </div>
      </div>
    </div>
  )
}
