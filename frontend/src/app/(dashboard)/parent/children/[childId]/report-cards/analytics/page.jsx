'use client'

export default function ChildPerformanceAnalyticsPage({ params }) {
  const { childId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-600 mt-2">Performance analysis and charts</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
