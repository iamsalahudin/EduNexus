'use client'

const STATUS_STYLES = {
  // Attendance statuses
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  late: 'bg-amber-100 text-amber-700 border-amber-200',
  'excused': 'bg-blue-100 text-blue-700 border-blue-200',
  leave: 'bg-blue-100 text-blue-700 border-blue-200',

  // Complaint statuses
  open: 'bg-red-100 text-red-700 border-red-200',
  assigned: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',

  // Generic statuses
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function StatusBadge({ status = '', className = '', variant = 'filled' }) {
  const normalizedStatus = String(status || '').toLowerCase().trim()
  const style = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.info

  if (variant === 'outline') {
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${style} ${className}`}>
        {status}
      </span>
    )
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${style} ${className}`}>
      {status}
    </span>
  )
}
