import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function ReceptionComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Review and resolve complaints assigned to reception."
      allowStatus
      showOnlyAssigned
    />
  )
}
