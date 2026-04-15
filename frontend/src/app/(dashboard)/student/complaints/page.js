import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function Page() {
  return (
    <ComplaintsWorkspace
      title="My Complaints"
      subtitle="Submit complaints and track updates from staff."
      allowCreate
    />
  )
}
