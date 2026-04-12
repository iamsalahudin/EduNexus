export default function Page() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fee Income</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review fee records timewise and download reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/accountant/income/fees/student-status" className="rounded-lg border bg-white p-4 hover-theme-primary">Student Fee Status</a>
        <a href="/accountant/reports/income" className="rounded-lg border bg-white p-4 hover-theme-primary">Income Reports</a>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Supported filters: this month, last month, selected duration, this year, and last year with export options.
      </div>
    </div>
  )
}
