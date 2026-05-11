'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryRecordsPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Salary Records"
      subtitle="Search salary history, slip details, status updates, and downloads."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate={false}
      allowPayments
    />
  )
}
