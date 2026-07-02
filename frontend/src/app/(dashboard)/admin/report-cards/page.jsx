'use client'

import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function ReportCardsPage() {
  const sections = [
    {
      title: 'Generate',
      description: 'Create report cards for selected classes or students.',
      href: '/admin/report-cards/generate'
    },
    {
      title: 'Template',
      description: 'Edit the report card layout and branding.',
      href: '/admin/report-cards/template'
    },
    {
      title: 'Class View',
      description: 'Review report cards by class before publishing.',
      href: '/admin/report-cards/class'
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Cards"
        subtitle="Design, generate, and review student report cards before publishing."
      />

      <div className="grid gap-4 md:grid-cols-3">
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

      <Card className="border-l-4 border-l-violet-800 bg-violet-500/10 text-violet-800">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-violet-700">Output</div>
            <div className="mt-1 font-semibold text-gray-900">Publishable term report cards</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-violet-700">Template</div>
            <div className="mt-1 font-semibold text-gray-900">Branding and layout controls</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-violet-700">Review</div>
            <div className="mt-1 font-semibold text-gray-900">Class and student verification</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
