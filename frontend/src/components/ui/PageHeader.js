"use client"

export default function PageHeader({
  title,
  subtitle,
  right = null,
  className = ''
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-600 mt-1">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  )
}
