'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryPage() {
  return (
    <SalaryWorkspace
      roleBase="/hr"
      title="Salary Management"
      subtitle="HR salary overview, staff management, records, reports, and advance handling."
      showStaffManagement
      showStructureManagement
      showGenerate
      allowPayments
      reportHref="/hr/reports/salary"
    />
  )
}
