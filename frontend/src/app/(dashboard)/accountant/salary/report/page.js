'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function AccountantSalaryReportPage() {
  return (
    <SalaryWorkspace
      roleBase="/accountant"
      title="Salary Reports"
      subtitle="Review salary payout totals, trend snapshots, and export-ready finance reports."
      showGenerate={false}
      allowPayments={false}
      showFinanceRef
      reportHref="/accountant/salary/report"
    />
  )
}
