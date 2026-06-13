"use client"

import { Card } from '@/components/ui'

export default function AttendanceRateCard({
  title = 'Attendance Rate',
  percentage = 0,
  summary = '',
  barClassName = 'bg-blue-600',
  valueClassName = 'text-blue-600',
}) {
  return (
    <Card className="mt-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className={`${barClassName} h-4 rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${valueClassName}`}>{percentage}%</span>
          </div>
          {summary ? <p className="text-xs text-gray-500">{summary}</p> : null}
        </div>
      </div>
    </Card>
  )
}
