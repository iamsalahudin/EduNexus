'use client'

export default function TeacherProfilePage({ params }) {
  const { teacherId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Profile</h1>
        <p className="text-gray-600 mt-2">View teacher details</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
