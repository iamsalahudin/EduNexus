"use client"

import { useAuth } from '@/context/AuthContext'

export default function PrincipalProfileSettings() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Your account information.</p>
      </div>

      <div className="card max-w-2xl text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-gray-600">Name</div>
          <div className="font-medium">{user?.name || '-'}</div>
        </div>
        <div>
          <div className="text-gray-600">Email</div>
          <div className="font-medium">{user?.email || '-'}</div>
        </div>
        <div>
          <div className="text-gray-600">Role</div>
          <div className="font-medium">{user?.role || '-'}</div>
        </div>
        <div>
          <div className="text-gray-600">Active</div>
          <div className="font-medium">{user?.active === false ? 'No' : 'Yes'}</div>
        </div>
      </div>
    </div>
  )
}
