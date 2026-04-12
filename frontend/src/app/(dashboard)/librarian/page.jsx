'use client'

export default function LibrarianDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Librarian Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage library books, issues, and fines</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="text-sm text-gray-500">Total Books</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500">Currently Issued</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500">Pending Returns</div>
          <div className="mt-2 text-2xl font-semibold">0</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500">Total Fines</div>
          <div className="mt-2 text-2xl font-semibold">Rs 0</div>
        </div>
      </div>
      
      {/* Dashboard content will be added here */}
    </div>
  )
}
