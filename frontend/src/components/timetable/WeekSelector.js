// WeekSelector.js
'use client'

import React from 'react'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function WeekSelector({ value, onChange }) {
  const { mode, days } = value

  function toggleDay(d) {
    if (days.includes(d)) {
      onChange({ ...value, days: days.filter(x => x !== d) })
    } else {
      onChange({ ...value, days: [...days, d] })
    }
  }

  return (
    <div className="card space-y-4">
      <div className="text-sm font-medium">Week Configuration</div>

      <div className="flex gap-3">
        <button
          onClick={() => onChange({ mode: 'same', days: DAYS })}
          className={`px-3 py-2 border rounded ${
            mode === 'same' ? 'border-theme-primary bg-theme-primary/10' : ''
          }`}
        >
          Same for whole week
        </button>

        <button
          onClick={() => onChange({ mode: 'different', days })}
          className={`px-3 py-2 border rounded ${
            mode === 'different' ? 'border-theme-primary bg-theme-primary/10' : ''
          }`}
        >
          Different by day
        </button>
      </div>

      {mode === 'different' && (
        <div className="flex flex-wrap gap-2">
          {DAYS.map(d => (
            <div
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-2 rounded border cursor-pointer text-sm ${
                days.includes(d)
                  ? 'border-theme-primary bg-theme-primary/10'
                  : 'opacity-60'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
