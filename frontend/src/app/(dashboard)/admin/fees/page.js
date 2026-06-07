"use client"

import FeesDashboard from '@/components/fees/FeesDashboard'

export default function FeesHome() {
  return (
    <FeesDashboard
      roleBase="/admin"
      title="Fees"
      subtitle="Manage fee structure, voucher, collection, records, defaulters, and reports from one place."
      showGenerate
      showFinanceRef
      financeLinks={[
        { href: '/admin/finance/income', label: 'Open Income Reference', variant: 'outline' },
        { href: '/admin/finance/reports', label: 'Open Finance Reports', variant: 'outline' },
        { href: '/admin/finance/categories', label: 'Open Finance Categories', variant: 'outline' }
      ]}
      actionLinks={[
        { href: '/admin/fees/collection', label: 'Fee Collection', variant: 'primary' },
        { href: '/admin/fees/record', label: 'Past Fee Records', variant: 'outline' },
        { href: '/admin/fees/defaulters', label: 'Defaulters', variant: 'outline' },
        { href: '/admin/fees/structure', label: 'Fee Structure', variant: 'outline' },
        { href: '/admin/fees/voucher', label: 'Fee Voucher', variant: 'outline' }
      ]}
    />
  )
}

