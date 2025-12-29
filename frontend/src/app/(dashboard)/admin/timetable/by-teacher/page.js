'use client'

import React, { useMemo, useState } from 'react'
import { mockTimetable } from '@/utils/mockTimetable'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function ByTeacherTimetablePage(){
  // derive teacher list from weeklyGrids (unique)
  const teachersList = useMemo(() => {
    const set = new Set()
    const wg = mockTimetable.weeklyGrids || {}
    DAYS.forEach(d => {
      const day = wg[d]
      if(!day) return
      day.forEach(cls => {
        Object.values(cls.periods || {}).forEach(p => {
          if(p && p.teacher) set.add(p.teacher)
        })
      })
    })
    return Array.from(set)
  }, [])

  const [teacher, setTeacher] = useState(teachersList[0] || '')

  const timeSlots = mockTimetable.timeSlots.map(ts => ts.label)
  const weekly = mockTimetable.weeklyGrids || {}

  // For a given day and time, find if teacher is teaching anywhere: return {classId, className, subject, room}
  function teacherCell(day, time){
    const dayGrid = weekly[day]
    if(!dayGrid) return null
    for(const cls of dayGrid){
      const p = cls.periods?.[time]
      if(p && p.teacher === teacher){
        return { classId: cls.id, className: cls.name, subject: p.subject, room: p.room }
      }
    }
    return null
  }

  function downloadCSV(){
    const header = ['Time', ...DAYS]
    const rows = [header]
    for(const t of timeSlots){
      const row = [t]
      for(const d of DAYS){
        const info = teacherCell(d,t)
        if(!info) row.push('')
        else row.push(`${info.className}: ${info.subject || ''} (${info.room || ''})`)
      }
      rows.push(row)
    }
    const csv = rows.map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teacher || 'teacher'}-timetable.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadXlsHtml(){
    let html = '<table border="1"><thead><tr><th>Time</th>'
    for(const d of DAYS) html += `<th>${d}</th>`
    html += '</tr></thead><tbody>'
    for(const t of timeSlots){
      html += `<tr><td>${t}</td>`
      for(const d of DAYS){
        const info = teacherCell(d,t)
        html += `<td>${info ? `<strong>${info.className}</strong><div>${info.subject||''}</div><div>${info.room||''}</div>` : ''}</td>`
      }
      html += '</tr>'
    }
    html += '</tbody></table>'
    const blob = new Blob([html], {type: 'application/vnd.ms-excel'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teacher || 'teacher'}-timetable.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF(){
    const win = window.open('','_blank','noopener')
    if(!win) { alert('Popup blocked — allow popups'); return }
    const style = `<style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px}</style>`
    let html = `<html><head><title>${teacher} Timetable</title>${style}</head><body>`
    html += `<h2>${mockTimetable.name} — ${teacher}</h2>`
    html += '<table><thead><tr><th>Time</th>'
    for(const d of DAYS) html += `<th>${d}</th>`
    html += '</tr></thead><tbody>'
    for(const t of timeSlots){
      html += `<tr><td>${t}</td>`
      for(const d of DAYS){
        const info = teacherCell(d,t)
        html += `<td>${info ? `<strong>${info.className}</strong><div>${info.subject||''}</div><div>${info.room||''}</div>` : ''}</td>`
      }
      html += '</tr>'
    }
    html += '</tbody></table></body></html>'
    win.document.write(html)
    win.document.close()
    setTimeout(()=>win.print(),200)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timetable — By Teacher</h1>
          <p className="text-sm text-gray-600">Choose a teacher to view their timetable across days.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={downloadXlsHtml} className="px-3 py-2 border rounded">Export XLS</button>
          <button onClick={exportPDF} className="px-3 py-2 border rounded">Export PDF</button>
        </div>
      </div>

      <div className="card p-4">
        <label className="text-sm font-medium">Teacher</label>
        <select className="input mt-2" value={teacher} onChange={e=>setTeacher(e.target.value)}>
          {teachersList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card p-4 overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Time</th>
              {DAYS.map(d => <th key={d} className="p-2 text-left">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(t => (
              <tr key={t} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 align-top">{t}</td>
                {DAYS.map(d => {
                  const info = teacherCell(d,t)
                  return (
                    <td key={d+t} className="p-2 align-top">
                      {info ? (
                        <div>
                          <div className="font-semibold">{info.subject}</div>
                          <div className="text-sm text-gray-600">{info.className}</div>
                          <div className="text-xs text-gray-500">{info.room}</div>
                        </div>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
