'use client'

import FeeCollectionWorkspace from '@/components/fees/FeeCollectionWorkspace'

export default function FeeCollectionPage() {
  return (
    <FeeCollectionWorkspace
      title="Fee Collection"
      subtitle="Mark auto-generated monthly student fee as paid or keep unpaid status."
      defaultStatus="pending"
      allowPendingToggle={false}
      note="Reception workflow does not allow editing fee amount; only status update is permitted."
    />
  )
}
