import { Card } from "@/components/ui";
import { PageHeader } from "@/components/ui";
import StaffAttendanceRecordsView from "@/components/attendance/StaffAttendanceRecordsView";

export default function AttendanceReportsPage() {
  return(<div>
        <PageHeader
          title="Attendance Reports"
          subtitle="Download and view detailed attendance reports for your assigned classes. Apply filters to analyze attendance patterns."
        />
  
        <Card className="mt-6">
          <StaffAttendanceRecordsView
            title="My Attendance"
            description="Auto-loaded teacher attendance with monthly, yearly, and custom range summaries."
          />
        </Card>
      </div>
  )
}
