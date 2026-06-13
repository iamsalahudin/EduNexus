"use client"

import AttendanceSummaryCard from '@/components/attendance/AttendanceSummaryCard'

function resolveColumnsClass(columns) {
  if (columns === 2) return 'md:grid-cols-2'
  if (columns === 3) return 'md:grid-cols-3'
  if (columns === 4) return 'md:grid-cols-4'
  return 'md:grid-cols-5'
}

export default function AttendanceStatsGrid({ items = [], columns = 5, className = '' }) {
  const colsClass = resolveColumnsClass(columns)

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-4 ${className}`}>
      {items.map((item) => (
        <AttendanceSummaryCard
          key={item.key || item.label}
          label={item.label}
          value={item.value}
          sublabel={item.sublabel}
          className={item.className}
          labelClassName={item.labelClassName}
          valueClassName={item.valueClassName}
          sublabelClassName={item.sublabelClassName}
        />
      ))}
    </div>
  )
}
