'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryReportPage() {
  return (
    <SalaryWorkspace
      roleBase="/admin"
      title="Salary Reports"
      subtitle="Review payroll activity, slips, paid history, and downloadable records."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate={false}
      allowPayments={false}
      reportHref="/admin/salary/report"
    />
  )
}