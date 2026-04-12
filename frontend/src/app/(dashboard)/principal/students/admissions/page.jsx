'use client'

import AdmissionForm from '@/components/students/AdmissionForm'
import { PageHeader } from '@/components/ui'

export default function AdmissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Admissions"
        subtitle="Create student and parent records with complete admission details."
      />

      <AdmissionForm />
    </div>
  )
}
