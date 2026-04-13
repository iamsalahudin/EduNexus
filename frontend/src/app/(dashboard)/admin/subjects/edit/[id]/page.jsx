'use client'

export default function EditSubjectPage({ params }) {
  const { id } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Subject</h1>
        <p className="text-gray-600 mt-2">Update subject details</p>
      </div>
      {/* Form will be added here */}
    </div>
  )
}
