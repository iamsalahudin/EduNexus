import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function ComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Handle complaints routed to HR and update outcomes."
      allowStatus
      showOnlyAssigned
    />
  )
}
