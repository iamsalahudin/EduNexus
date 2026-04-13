'use client'

export default function EditEmployeePage({ params }) {
  const { employeeId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Employee Info</h1>
        <p className="text-gray-600 mt-2">Update employee information</p>
      </div>
      {/* Form will be added here */}
    </div>
  )
}
