'use client'

import TransportManagementWorkspace from '@/components/transport/TransportManagementWorkspace'

export default function ReceptionTransportPage() {
  return (
    <TransportManagementWorkspace
      title="Transport"
      subtitle="Manage enrollments and payment status for transport users."
      canManageRoutes={false}
      canManageReports={false}
      canDelete
      canManagePayments
    />
  )
}
