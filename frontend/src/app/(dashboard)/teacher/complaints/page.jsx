import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function ComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Respond to complaints assigned to you and update progress."
      allowStatus
      showOnlyAssigned
    />
  )
}
