'use client'

import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function HostelPage() {
  const sections = [
    {
      title: 'Hostels',
      description: 'Create and organize hostel blocks and wings.',
      href: '/admin/hostel/hostels'
    },
    {
      title: 'Rooms',
      description: 'Assign room capacity, occupancy, and room status.',
      href: '/admin/hostel/rooms'
    },
    {
      title: 'Students',
      description: 'Manage hostel residents and room allocations.',
      href: '/admin/hostel/students'
    },
    {
      title: 'Fees',
      description: 'Track hostel fee schedules and payment coverage.',
      href: '/admin/hostel/fees'
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Management"
        subtitle="Coordinate hostels, rooms, resident students, and fee records."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => (
          <Card key={section.href}>
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <div className="mt-4">
              <ButtonLink href={section.href} variant="outline">Open</ButtonLink>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-l-4 border-l-sky-500 bg-sky-50">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-700">Coverage</div>
            <div className="mt-1 font-semibold text-gray-900">Hostels, rooms, and residents</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-700">Control</div>
            <div className="mt-1 font-semibold text-gray-900">Occupancy and allocation review</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-700">Finance</div>
            <div className="mt-1 font-semibold text-gray-900">Track hostel fees against residents</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
