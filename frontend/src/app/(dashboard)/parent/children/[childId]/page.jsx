'use client'

export default function ChildOverviewPage({ params }) {
  const { childId } = params

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Child Overview</h1>
          <p className="text-gray-600 mt-2">Overview of child's academic progress</p>
        </div>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
