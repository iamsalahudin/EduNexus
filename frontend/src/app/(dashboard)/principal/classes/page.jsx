'use client'

import { ButtonLink } from '@/components/ui'

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-2">View all classes</p>
        </div>
        <ButtonLink href="/principal/classes/rooms">Manage Rooms</ButtonLink>
      </div>
      {/* Content will be added here */}
    </div>
  )
}
