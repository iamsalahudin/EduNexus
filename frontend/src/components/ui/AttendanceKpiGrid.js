<<<<<<< HEAD
'use client'

import Card from './Card'

const TONE_STYLES = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
}

export default function AttendanceKpiGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className={`border ${TONE_STYLES[item.tone] || TONE_STYLES.slate}`}>
          <div className="text-sm font-medium opacity-80">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold leading-none">{item.value}</div>
          {item.hint ? <div className="mt-2 text-xs opacity-80">{item.hint}</div> : null}
        </Card>
      ))}
    </div>
  )
=======
'use client'

import Card from './Card'

const TONE_STYLES = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
}

export default function AttendanceKpiGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className={`border ${TONE_STYLES[item.tone] || TONE_STYLES.slate}`}>
          <div className="text-sm font-medium opacity-80">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold leading-none">{item.value}</div>
          {item.hint ? <div className="mt-2 text-xs opacity-80">{item.hint}</div> : null}
        </Card>
      ))}
    </div>
  )
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}