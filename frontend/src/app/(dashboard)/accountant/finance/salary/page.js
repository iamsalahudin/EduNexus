'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function AccountantFinanceSalaryPage() {
  return (
    <SalaryWorkspace
      roleBase="/accountant"
      title="Finance Salary"
      subtitle="Dedicated finance salary monitor for monthly payroll totals, records, and exports."
      showGenerate={false}
      allowPayments={false}
      showFinanceRef
      reportHref="/accountant/salary/report"
    />
  )
}
