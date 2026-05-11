import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function Page() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Track and resolve complaints assigned to reception."
      allowStatus
      showOnlyAssigned
    />
  )
}
