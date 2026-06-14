"use client"

import PageHeader from '@/components/ui/PageHeader'
import ButtonLink from '@/components/ui/ButtonLink'
import DailyStudentAttendanceView from '@/components/attendance/DailyStudentAttendanceView'

export default function DailyStudentAttendancePage() {
  
  return (
    <div>
      <PageHeader
        title="Daily Student Attendance"
        subtitle="View and manage student attendance for a specific date by class and section."
        right={<ButtonLink href="/principal/attendance" variant="secondary">Back</ButtonLink>}
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      {/* FILTERS */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
          />
          <Select
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setSection('')
            }}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((c) => ({ value: c._id, label: c.name }))
            ]}
          />
          <Select
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!classId}
            options={[
              { value: '', label: 'All Sections' },
              ...classSections.map((sec) => ({ value: sec, label: sec }))
            ]}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* SUMMARY CARDS */}
      {classId && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Students</div>
            <div className="mt-2 text-2xl font-bold text-blue-700">{summary.total}</div>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Present</div>
            <div className="mt-2 text-2xl font-bold text-green-700">{summary.present}</div>
          </Card>
          <Card className="bg-red-50 border border-red-200">
            <div className="text-sm text-red-600 font-medium">Absent</div>
            <div className="mt-2 text-2xl font-bold text-red-700">{summary.absent}</div>
          </Card>
          <Card className="bg-amber-50 border border-amber-200">
            <div className="text-sm text-amber-600 font-medium">Late</div>
            <div className="mt-2 text-2xl font-bold text-amber-700">{summary.late}</div>
          </Card>
          <Card className="bg-purple-50 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Excused</div>
            <div className="mt-2 text-2xl font-bold text-purple-700">{summary.excused}</div>
          </Card>
        </div>
      )}

      {/* ATTENDANCE TABLE */}
      {classId && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Attendance Records</h3>
          <div className="overflow-auto">
            {loading && students.length === 0 ? (
              <Skeleton className="h-64" />
            ) : students.length === 0 ? (
              <div className="text-sm text-gray-600 py-4">No students found for selected class and section.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Section</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const attendanceStatus = student.attendance?.status || 'present'
                    const recordId = student.attendance?._id
                    return (
                      <tr key={student._id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4">{student.name || '-'}</td>
                        <td className="py-3 px-4">{student.class?.name || '-'}</td>
                        <td className="py-3 px-4">{student.section || '-'}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={attendanceStatus}
                            onChange={(e) => handleStatusChange(student._id, recordId, e.target.value)}
                            disabled={updating}
                            options={ATTENDANCE_STATUS_OPTIONS}
                            className={`py-1 px-2 text-sm rounded ${
                              attendanceStatus === 'present' ? 'bg-green-100 text-green-700' :
                              attendanceStatus === 'absent' ? 'bg-red-100 text-red-700' :
                              attendanceStatus === 'late' ? 'bg-amber-100 text-amber-700' :
                              'bg-purple-100 text-purple-700'
                            }`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {!classId && (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <div className="text-center text-blue-700">
            <p className="text-sm">Select a class above to view and manage attendance for {date || 'the selected date'}.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
