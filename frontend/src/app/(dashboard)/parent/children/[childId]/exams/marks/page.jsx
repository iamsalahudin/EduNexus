'use client'

export default function ChildExamMarksPage({ params }) {
  const { childId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Marks</h1>
        <p className="text-gray-600 mt-2">View child's exam marks and grades</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
