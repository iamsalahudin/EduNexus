import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function ComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Complaints"
      subtitle="Monitor complaints, assign responders, and close cases."
      allowAssign
      allowStatus
    />
  )
}
