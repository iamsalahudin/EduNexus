import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function ComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Complaints"
      subtitle="Review, assign, and track complaints across all departments."
      allowAssign
      allowStatus
    />
  )
}
