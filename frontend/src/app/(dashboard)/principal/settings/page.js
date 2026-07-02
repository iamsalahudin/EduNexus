"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import SubHeader from '@/components/layout/SubHeader'

export default function AdminSettingsHome() {
  const breadcrumb = useMemo(
    () => [{ id: 1, name: 'Settings', link: '/principal/settings' }],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/principal/settings/profile" className="card nav-item">
          <div className="font-medium">Profile</div>
          <div className="text-sm text-gray-600 mt-1">Update name and email.</div>
        </Link>

        <Link href="/principal/settings/security" className="card nav-item">
          <div className="font-medium">Security</div>
          <div className="text-sm text-gray-600 mt-1">Change your password.</div>
        </Link>

        <Link href="/principal/settings/notifications" className="card nav-item">
          <div className="font-medium">Notifications</div>
          <div className="text-sm text-gray-600 mt-1">Basic notification preferences.</div>
        </Link>

      </div>
    </div>
  )
}