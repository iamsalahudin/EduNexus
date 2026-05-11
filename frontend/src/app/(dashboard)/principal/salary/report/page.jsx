'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryReportPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Salary Reports"
      subtitle="Review payroll activity, slips, paid history, and downloadable records."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate={false}
      allowPayments={false}
      reportHref="/principal/salary/report"
    />
  )
}