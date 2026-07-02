'use client'

export default function ReviewApplicationPage({ params }) {
  const { appId } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Application</h1>
        <p className="text-gray-600 mt-2">Review individual job application</p>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
