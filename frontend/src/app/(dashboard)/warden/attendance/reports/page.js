"use client"

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function WardenReportsPage() {
  const today = toInputDate(new Date())
  const [fromDate, setFromDate] = useState(toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30)))
  const [toDate, setToDate] = useState(today)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function loadReport() {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call once hostel attendance endpoints are implemented
      // await fetchHostelAttendanceReport({ fromDate, toDate })

      // Mock data for now
      const mockReport = {
        totalDays: 30,
        totalHostellers: 150,
        avgPresent: 140,
        avgAbsent: 10,
        avgCheckInRate: 93.3,
        avgCheckOutRate: 91.3,
        mostAbsent: ['Ahmed Hassan', 'Ali Raza'],
        lateArrivals: 23,
        earlyCheckOuts: 15
      }
      setReportData(mockReport)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate])

  async function handleExportReport() {
    try {
      // TODO: Implement export functionality
      // await exportHostelAttendanceReport({ fromDate, toDate })
      alert('Export functionality will be available soon')
    } catch (e) {
      setError(e?.message || 'Failed to export report')
    }
  }

  return (
    <div>
      <PageHeader
        title="Hostel Attendance Reports"
        subtitle="View comprehensive hostel attendance analytics and reports."
        right={<ButtonLink href="/warden/attendance" variant="secondary">Back</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={loadReport} disabled={loading}>
              Generate Report
            </Button>
            <Button variant="outline" onClick={handleExportReport} disabled={loading || !reportData}>
              Export
            </Button>
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </Card>

      {loading ? (
        <div className="mt-6">
          <Skeleton className="h-64" />
        </div>
      ) : reportData ? (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500">Total Hostellers</div>
              <div className="mt-2 text-2xl font-semibold">{reportData.totalHostellers}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Avg Present</div>
              <div className="mt-2 text-2xl font-semibold">{reportData.avgPresent}</div>
              <div className="mt-1 text-xs text-gray-500">{((reportData.avgPresent / reportData.totalHostellers) * 100).toFixed(1)}%</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Avg Absent</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">{reportData.avgAbsent}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500">Avg Check-In Rate</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">{reportData.avgCheckInRate.toFixed(1)}%</div>
              <div className="mt-3 bg-gray-100 rounded h-2">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{ width: `${reportData.avgCheckInRate}%` }}
                />
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-500">Avg Check-Out Rate</div>
              <div className="mt-2 text-2xl font-semibold text-blue-600">{reportData.avgCheckOutRate.toFixed(1)}%</div>
              <div className="mt-3 bg-gray-100 rounded h-2">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${reportData.avgCheckOutRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="font-medium">Frequent Absentees</h3>
              <div className="mt-3 space-y-2">
                {reportData.mostAbsent.length > 0 ? (
                  reportData.mostAbsent.map((name, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded mr-2">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700">{name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No data available</div>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-medium">Time-Related Issues</h3>
              <div className="mt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Late Arrivals</span>
                  <span className="font-semibold text-amber-600">{reportData.lateArrivals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Early Check-Outs</span>
                  <span className="font-semibold text-blue-600">{reportData.earlyCheckOuts}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
