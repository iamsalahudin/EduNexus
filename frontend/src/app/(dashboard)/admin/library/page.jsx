'use client'

import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function LibraryPage() {
  const sections = [
    {
      title: 'Books',
      description: 'Add, review, and organize the library catalog.',
      href: '/admin/library/books'
    },
    {
      title: 'Issue Books',
      description: 'Issue books to students and track due dates.',
      href: '/admin/library/issue'
    },
    {
      title: 'Returns',
      description: 'Process returned books and close open issues.',
      href: '/admin/library/returns'
    },
    {
      title: 'Fines',
      description: 'Review overdue penalties and unpaid balances.',
      href: '/admin/library/fines'
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Management"
        subtitle="Manage the catalog, book circulation, returns, and fines from one place."
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

      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">Workflow</div>
            <div className="mt-1 font-semibold text-gray-900">Catalog to circulation</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">Tracking</div>
            <div className="mt-1 font-semibold text-gray-900">Issue, return, and fine status</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">Usage</div>
            <div className="mt-1 font-semibold text-gray-900">Books, students, and overdue items</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
