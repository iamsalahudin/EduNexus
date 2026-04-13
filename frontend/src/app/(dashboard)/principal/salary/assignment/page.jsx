'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryAssignmentPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Salary Assignment"
      subtitle="Assign salary packages to teachers and salary-only staff."
      showStaffManagement
      showStructureManagement={false}
      showGenerate={false}
      allowPayments={false}
      reportHref="/principal/salary/report"
    />
  )
}