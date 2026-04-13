"use client"

export default function StatCard({
  label,
  value,
  className = ''
}) {
  return (
    <div className={`card ${className}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}
