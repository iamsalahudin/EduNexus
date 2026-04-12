"use client"

import ReadOnlyUsersDashboard from '@/components/users/ReadOnlyUsersDashboard'

export default function PrincipalUsersPage() {
  return (
    <ReadOnlyUsersDashboard
      title="Users"
      subtitle="Read-only users overview for principal role."
    />
  )
}
