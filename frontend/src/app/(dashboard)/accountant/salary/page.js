import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function Page() {
  return (
    <SalaryWorkspace
      roleBase="/accountant"
      title="Salary"
      subtitle="Transaction-based salary reports and finance reference views."
      showGenerate={false}
      allowPayments={false}
      showFinanceRef
      reportHref="/accountant/salary/report"
    />
  )
}
