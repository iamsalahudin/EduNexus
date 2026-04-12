'use client'

export default function StudentReportCardPage({ params }) {
  const { studentId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Report Card</h1>
        <p className="text-gray-600 mt-2">View individual student report card</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
