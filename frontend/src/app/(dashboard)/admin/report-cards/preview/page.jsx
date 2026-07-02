import React from 'react'

export default function ReportCardPreviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Report Card Print Preview</h1>

      <div className="report-card card">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold">Springfield High School</h2>
          <div className="text-sm text-gray-600">Academic Year 2025-2026</div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <div>
              <div className="font-semibold">Student:</div>
              <div>John Doe</div>
              <div>Class: 10</div>
              <div>Section: A</div>
            </div>
            <div>
              <div className="font-semibold">Term:</div>
              <div>Term 1</div>
              <div className="mt-2">Student ID: STD-001</div>
            </div>
          </div>
        </div>

        <table className="w-full text-sm" aria-label="marks-table">
          <thead>
            <tr>
              <th className="text-left">Subject</th>
              <th className="text-right">Marks</th>
              <th className="text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mathematics</td>
              <td className="text-right">88</td>
              <td className="text-right">A</td>
            </tr>
            <tr>
              <td>Science</td>
              <td className="text-right">82</td>
              <td className="text-right">A-</td>
            </tr>
            <tr>
              <td>English</td>
              <td className="text-right">90</td>
              <td className="text-right">A+</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6">
          <div className="font-semibold">Remarks</div>
          <div>Good performance. Keep up the hard work.</div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500">Use browser Print (Ctrl+P) to preview A4 output.</p>
      </div>
    </div>
  )
}
