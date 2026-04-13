'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryPaymentsPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Salary Payments"
      subtitle="Update salary status, record advance payments, and download slips."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate={false}
      allowPayments
      reportHref="/principal/salary/report"
    />
  )
}