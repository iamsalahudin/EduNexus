"use client"
import { useState } from 'react'

export default function FilterForm({ initial = {}, onApply, monthAsNumber = false, yearMax }){
  const [form, setForm] = useState(initial)

  function setField(k,v){
    setForm(prev=>{
      const next = { ...prev, [k]: v }
      onApply && onApply(next)
      return next
    })
  }

  function reset(){ setForm({}); onApply && onApply({}) }

  const currentYear = new Date().getFullYear()
  const maxYear = yearMax || currentYear

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input placeholder="Roll Number" value={form.roll||''} onChange={e=>setField('roll', e.target.value)} className="px-2 py-1" />
        <input placeholder="Student Name" value={form.name||''} onChange={e=>setField('name', e.target.value)} className="px-2 py-1" />
        <input placeholder="Father Name" value={form.father||''} onChange={e=>setField('father', e.target.value)} className="px-2 py-1" />
        <input placeholder="Class" value={form.class||''} onChange={e=>setField('class', e.target.value)} className="px-2 py-1" />
        <input placeholder="Section" value={form.section||''} onChange={e=>setField('section', e.target.value)} className="px-2 py-1" />
        <select value={form.gender||''} onChange={e=>setField('gender', e.target.value)} className="px-2 py-1">
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>
        <select value={form.feeType||''} onChange={e=>setField('feeType', e.target.value)} className="px-2 py-1">
          <option value="">Fee Type</option>
          <option>Tuition</option>
          <option>Transport</option>
        </select>
        {monthAsNumber ? (
          <input type="number" min={1} max={12} placeholder="Month (1-12)" value={form.month||''} onChange={e=>setField('month', e.target.value)} className="px-2 py-1" />
        ) : (
          <input type="month" value={form.month||''} onChange={e=>setField('month', e.target.value)} className="px-2 py-1" />
        )}
        <input type="number" placeholder="Year" min={1900} max={maxYear} value={form.year||''} onChange={e=>setField('year', e.target.value)} className="px-2 py-1" />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={reset} className="px-4 py-2 border rounded">Reset</button>
      </div>
    </div>
  )
}
