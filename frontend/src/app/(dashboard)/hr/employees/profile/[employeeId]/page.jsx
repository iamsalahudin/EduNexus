'use client'

export default function EmployeeProfilePage({ params }) {
  const { employeeId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
        <p className="text-gray-600 mt-2">View employee details and history</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
