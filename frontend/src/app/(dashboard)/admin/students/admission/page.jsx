"use client"

import { PageHeader } from '@/components/ui'
import AdmissionForm from '@/components/students/AdmissionForm'

export default function AdmissionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Admission"
        subtitle="Create student + parent accounts and submit complete admission details."
      />

      <AdmissionForm />
    </div>
  )
}
