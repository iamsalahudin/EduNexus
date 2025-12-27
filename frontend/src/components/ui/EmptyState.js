"use client"
export default function EmptyState({title='No data', description=''}){
  return (
    <div className="card text-center py-8">
      <div className="text-lg font-semibold">{title}</div>
      {description && <div className="text-sm text-gray-500 mt-2">{description}</div>}
    </div>
  )
}
