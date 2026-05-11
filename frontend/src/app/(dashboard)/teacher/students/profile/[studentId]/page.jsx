'use client'

export default function StudentProfilePage({ params }) {
  const { studentId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
        <p className="text-gray-600 mt-2">View student details and performance</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
