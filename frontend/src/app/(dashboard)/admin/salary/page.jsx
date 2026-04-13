'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryPage() {
  return (
    <SalaryWorkspace
      roleBase="/admin"
      title="Salary Management"
      subtitle="Manage salary setup, staff assignment, monthly generation, payments, records, slips, and reports."
      showStaffManagement
      showStructureManagement
      showGenerate
      allowPayments
      showFinanceRef
      reportHref="/admin/salary/report"
    />
  )
}
