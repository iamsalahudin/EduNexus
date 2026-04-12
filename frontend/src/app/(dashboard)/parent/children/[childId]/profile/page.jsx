'use client'

export default function ChildProfilePage({ params }) {
  const { childId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Child Profile</h1>
        <p className="text-gray-600 mt-2">View child's profile details</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
