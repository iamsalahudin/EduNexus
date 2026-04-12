import { redirect } from 'next/navigation'

export default function ChildAttendanceSummaryPage({ params }) {
  const { childId } = params
  redirect(`/parent/children/${childId}/attendance`)
}
