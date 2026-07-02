'use client'

export default function EditContractPage({ params }) {
  const { employeeId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Contract</h1>
        <p className="text-gray-600 mt-2">Update employee contract details</p>
      </div>
      {/* Form will be added here */}
    </div>
  )
}
