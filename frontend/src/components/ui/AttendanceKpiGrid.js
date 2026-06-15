'use client'

import Card from './Card'

const TONE_STYLES = {
  blue: 'bg-blue-500/50 text-gray-800 dark:text-white',
  green: 'bg-green-500/50 text-gray-800 dark:text-white',
  red: 'bg-red-500/50 text-gray-800 dark:text-white',
  amber: 'bg-amber-500/50 text-gray-800 dark:text-white',
  slate: 'bg-slate-500/50 text-gray-800 dark:text-white',
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
}