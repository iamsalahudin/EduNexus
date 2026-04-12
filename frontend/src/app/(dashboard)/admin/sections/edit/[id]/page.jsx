'use client'

export default function EditSectionPage({ params }) {
  const { id } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Section</h1>
        <p className="text-gray-600 mt-2">Update section details</p>
      </div>
      {/* Form will be added here */}
    </div>
  )
}
