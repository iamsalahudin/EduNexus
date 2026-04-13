'use client'

import TransportManagementWorkspace from '@/components/transport/TransportManagementWorkspace'

export default function AdminTransportPage() {
  return (
    <TransportManagementWorkspace
      title="Transport"
      subtitle="Manage routes, enrollments, payment status, and transport reports."
      canManageRoutes
      canManageReports
      canDelete
      canManagePayments
    />
  )
}
