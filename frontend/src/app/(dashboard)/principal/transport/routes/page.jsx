'use client'

import TransportManagementWorkspace from '@/components/transport/TransportManagementWorkspace'

export default function PrincipalTransportRoutesPage() {
  return (
    <TransportManagementWorkspace
      title="Transport Routes"
      subtitle="Configure routes with pickup/drop points, fees, and driver/vehicle details."
      canManageRoutes
      canManageReports={false}
      canDelete={false}
      canManagePayments={false}
    />
  )
}
