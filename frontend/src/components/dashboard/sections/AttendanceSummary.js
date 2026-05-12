'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { AttendanceCard } from '@/components/dashboard/cards/AttendanceCard';
import Card from '@/components/ui/Card';

export function AttendanceSummary({ standalone = false }) {
  const { attendance, loading } = useDashboard({
    fetchSummary: false,
    fetchAttendance: true,
    fetchFinance: false,
    fetchClasses: false,
    fetchActivities: false,
    fetchNotifications: false
  });

  const content = (
    <AttendanceCard
      title="Today's Attendance"
      students={attendance?.students}
      teachers={attendance?.teachers}
      loading={loading}
    />
  );

  if (standalone) {
    return <Card>{content}</Card>;
  }

  return content;
}
