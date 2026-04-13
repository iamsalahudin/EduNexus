'use client'

import TransportManagementWorkspace from '@/components/transport/TransportManagementWorkspace'

export default function PrincipalTransportVehiclesPage() {
  return (
    <TransportManagementWorkspace
      title="Transport Vehicles"
      subtitle="Review routes and attached vehicle/driver information."
      canManageRoutes
      canManageReports={false}
      canDelete={false}
      canManagePayments={false}
    />
  )
}
