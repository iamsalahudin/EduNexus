'use client'

import TransportSelfWorkspace from '@/components/transport/TransportSelfWorkspace'

export default function TeacherTransportPage() {
  return (
    <TransportSelfWorkspace
      readOnly
      title="Transport"
      subtitle="View available routes, your transport details, and payment history."
    />
  )
}
