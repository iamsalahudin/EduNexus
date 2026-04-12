'use client'

export default function FinanceCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Categories</h1>
        <p className="text-gray-600 mt-2">Fee categories and liabilities references from fees module.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/fees/structure" className="rounded-lg border bg-white p-4 hover-theme-primary">Fee Structure Categories</a>
        <a href="/admin/fees/voucher" className="rounded-lg border bg-white p-4 hover-theme-primary">Voucher Categories</a>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        This page is reference-only for admin finance. Category operations remain in fee structure and voucher pages.
      </div>
    </div>
  )
}
