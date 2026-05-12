"use client"

import { ButtonLink, PageHeader } from '@/components/ui'
import DatesheetGridPage from '@/components/exams/DatesheetGridPage'

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Manage datesheets and exam lifecycle from a single listing view."
        right={<ButtonLink href="/admin/exams/add">Setup Exams</ButtonLink>}
      />

      <div className="mt-6">
        <DatesheetGridPage
          showHeader={false}
          title=""
          subtitle=""
          canManage
          baseRole="admin"
        />
      </div>
    </div>
  )
}
