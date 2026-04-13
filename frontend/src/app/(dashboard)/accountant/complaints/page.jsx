import ComplaintsWorkspace from '@/components/complaints/ComplaintsWorkspace'

export default function FinanceComplaintsPage() {
  return (
    <ComplaintsWorkspace
      title="Assigned Complaints"
      subtitle="Work on complaints assigned to finance/accounting."
      allowStatus
      showOnlyAssigned
    />
  )
}
