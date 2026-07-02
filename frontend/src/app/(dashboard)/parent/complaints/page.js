import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function Page() {
  return (
    <ComplaintsWorkspace
      title="My Complaints"
      subtitle="Submit concerns for your child and follow progress."
      allowCreate
    />
  )
}
