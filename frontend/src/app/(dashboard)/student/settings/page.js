'use client'

import Link from 'next/link'
import { Button, Card, PageHeader } from '@/components/ui'

const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'View and edit your personal information',
    href: '/student/settings/profile',
    icon: '👤',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Change your password',
    href: '/student/settings/security',
    icon: '🔒',
  },
]

export default function StudentSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => (
          <Link key={section.id} href={section.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{section.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  <div className="mt-3">
                    <Button variant="secondary" className="text-sm" asChild>
                      <span>Go to {section.title} →</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
  }
