import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function HostelComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Review and resolve complaints assigned to hostel management."
      allowStatus
      showOnlyAssigned
    />
  )
}
