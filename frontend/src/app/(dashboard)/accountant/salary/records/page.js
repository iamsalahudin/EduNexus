'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function AccountantSalaryRecordsPage() {
  return (
    <SalaryWorkspace
      roleBase="/accountant"
      title="Salary Records"
      subtitle="Finance-side salary transactions and slip history without operational identity details."
      showGenerate={false}
      allowPayments={false}
      showFinanceRef
      reportHref="/accountant/salary/report"
    />
  )
}
