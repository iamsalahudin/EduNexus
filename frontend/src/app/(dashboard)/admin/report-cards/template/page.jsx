'use client'

import { ButtonLink, Card, PageHeader } from '@/components/ui'

const GRADE_SCALE = [
  { grade: 'A+', range: '90 - 100%', remark: 'Outstanding' },
  { grade: 'A', range: '80 - 89%', remark: 'Excellent' },
  { grade: 'B', range: '70 - 79%', remark: 'Very Good' },
  { grade: 'C', range: '60 - 69%', remark: 'Good' },
  { grade: 'D', range: '50 - 59%', remark: 'Satisfactory' },
  { grade: 'F', range: 'Below 50%', remark: 'Needs Improvement' },
]

const SAMPLE_SUBJECTS = [
  { name: 'English', max: 100, obtained: 86, grade: 'A' },
  { name: 'Mathematics', max: 100, obtained: 92, grade: 'A+' },
  { name: 'Science', max: 100, obtained: 78, grade: 'B' },
  { name: 'Social Studies', max: 100, obtained: 74, grade: 'B' },
  { name: 'Computer', max: 100, obtained: 88, grade: 'A' },
]

export default function TemplateReportCardsPage() {
  const totalMax = SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.max, 0)
  const totalObtained = SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.obtained, 0)
  const percentage = totalMax ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Card Template"
        subtitle="Standard layout used when report cards are generated and exported (PDF/print)."
        right={<ButtonLink href="/admin/report-cards/generate" variant="primary">Generate Report Cards</ButtonLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Template preview */}
        <Card className="p-0 overflow-hidden">
          <div className="border-b bg-slate-50 px-6 py-3 text-sm font-medium text-slate-600">Template Preview</div>
          <div className="p-8">
            <div className="mx-auto max-w-2xl border border-slate-300 p-8">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h2 className="text-2xl font-bold tracking-wide text-slate-900">EduNexus School</h2>
                <p className="text-sm text-slate-500">Academic Progress Report</p>
              </div>

              {/* Student meta */}
              <div className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
                <div><span className="text-slate-500">Student:</span> <span className="font-medium">Sample Student</span></div>
                <div><span className="text-slate-500">Roll No:</span> <span className="font-medium">2025-001</span></div>
                <div><span className="text-slate-500">Class:</span> <span className="font-medium">Grade 5 - A</span></div>
                <div><span className="text-slate-500">Term:</span> <span className="font-medium">Term 1</span></div>
                <div><span className="text-slate-500">Session:</span> <span className="font-medium">2025-2026</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium">__ / __ / ____</span></div>
              </div>

              {/* Marks table */}
              <table className="mt-6 w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-300 px-3 py-2">Subject</th>
                    <th className="border border-slate-300 px-3 py-2 text-center">Max Marks</th>
                    <th className="border border-slate-300 px-3 py-2 text-center">Obtained</th>
                    <th className="border border-slate-300 px-3 py-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SUBJECTS.map((s) => (
                    <tr key={s.name}>
                      <td className="border border-slate-300 px-3 py-2">{s.name}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">{s.max}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">{s.obtained}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-medium">{s.grade}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="border border-slate-300 px-3 py-2">Total</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{totalMax}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{totalObtained}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{percentage}%</td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Result</div>
                  <div className="font-semibold text-green-700">PASS</div>
                </div>
                <div>
                  <div className="text-slate-500">Percentage</div>
                  <div className="font-semibold">{percentage}%</div>
                </div>
              </div>

              <div className="mt-10 flex items-end justify-between text-xs text-slate-500">
                <div className="border-t border-slate-400 pt-1 w-40 text-center">Class Teacher</div>
                <div className="border-t border-slate-400 pt-1 w-40 text-center">Principal</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Grading scale */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900">Grading Scale</h3>
            <p className="mt-1 text-sm text-slate-500">Grade boundaries applied to subject percentages.</p>
            <div className="mt-4 space-y-2">
              {GRADE_SCALE.map((g) => (
                <div key={g.grade} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-900 w-10">{g.grade}</span>
                  <span className="text-slate-600 flex-1">{g.range}</span>
                  <span className="text-slate-500">{g.remark}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900">How it works</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Enter marks per student on the Generate page.</li>
              <li>Each subject percentage maps to a grade using the scale above.</li>
              <li>Export as PDF/ZIP to print report cards in this layout.</li>
            </ul>
            <div className="mt-4">
              <ButtonLink href="/admin/report-cards/generate" variant="outline">Go to Generate</ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
