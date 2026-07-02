'use client'

import FeeCollectionWorkspace from '@/components/fees/FeeCollectionWorkspace'

export default function FeeCollectionPage() {
  return (
    <FeeCollectionWorkspace
      title="Fee Collection"
      subtitle="Manage monthly fee payment status and quickly locate student fee entries."
      note="Collection updates are persisted to the backend fee records."
    />
  )
}
