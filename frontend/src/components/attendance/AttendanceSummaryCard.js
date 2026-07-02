"use client"

import { Card } from '@/components/ui'

export default function AttendanceSummaryCard({
  label,
  value,
  sublabel,
  className = '',
  labelClassName = '',
  valueClassName = '',
  sublabelClassName = '',
}) {
  return (
    <Card className={className}>
      <div className={`text-sm text-gray-500 ${labelClassName}`}>{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</div>
      {sublabel ? <div className={`mt-1 text-xs text-gray-500 ${sublabelClassName}`}>{sublabel}</div> : null}
    </Card>
  )
}
