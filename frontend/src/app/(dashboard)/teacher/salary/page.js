import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function Page() {
  return (
    <SalaryWorkspace
      roleBase="/teacher"
      title="Salary"
      subtitle="View personal salary history, detailed slips, and downloadable salary PDFs."
      showGenerate={false}
      allowPayments={false}
      personalOnly
    />
  )
}
