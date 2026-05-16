import { api } from './api'

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function fetchFinanceOverview() {
  const [financeOverview, feeSummary, salarySummary] = await Promise.all([
    api.get('/dashboard/finance-overview'),
    api.get('/fees/summary'),
    api.get('/salary/summary')
  ])

  return {
    summary: {
      totalCollected: toNumber(financeOverview.data?.summary?.totalCollected ?? feeSummary.data?.totalCollected),
      totalExpenses: toNumber(financeOverview.data?.summary?.totalExpenses ?? salarySummary.data?.totalPayroll),
      netIncome: toNumber(
        financeOverview.data?.summary?.netIncome ??
          toNumber(financeOverview.data?.summary?.totalCollected ?? feeSummary.data?.totalCollected) -
            toNumber(financeOverview.data?.summary?.totalExpenses ?? salarySummary.data?.totalPayroll)
      ),
      pendingLiabilityThisMonth: toNumber(feeSummary.data?.pendingLiabilityThisMonth),
      salaryExpense: toNumber(salarySummary.data?.totalPayroll),
      paidSalary: toNumber(salarySummary.data?.paidAmount),
      payrollPending: toNumber(salarySummary.data?.pendingCount)
    },
    graphData: Array.isArray(financeOverview.data?.graphData) ? financeOverview.data.graphData : [],
    feeSummary: {
      totalStudents: toNumber(feeSummary.data?.totalStudents),
      paidThisMonth: toNumber(feeSummary.data?.paidThisMonth),
      pendingCount: toNumber(feeSummary.data?.pendingCount),
      incomingFeeThisMonth: toNumber(feeSummary.data?.incomingFeeThisMonth),
      pendingLiabilityThisMonth: toNumber(feeSummary.data?.pendingLiabilityThisMonth)
    },
    salarySummary: {
      staffCount: toNumber(salarySummary.data?.staffCount),
      slipCount: toNumber(salarySummary.data?.slipCount),
      paidCount: toNumber(salarySummary.data?.paidCount),
      pendingCount: toNumber(salarySummary.data?.pendingCount),
      totalPayroll: toNumber(salarySummary.data?.totalPayroll),
      paidAmount: toNumber(salarySummary.data?.paidAmount),
      advanceTotal: toNumber(salarySummary.data?.advanceTotal)
    }
  }
}

export async function fetchFinanceSettings() {
  const { data } = await api.get('/finance/settings')
  return data?.settings || {
    key: 'default',
    fiscalYear: '',
    currency: 'PKR',
    defaultIncomeCategory: 'Tuition Fees',
    defaultExpenseCategory: 'Operational Expenses',
    defaultLiabilityCategory: 'Outstanding Dues'
  }
}

export async function saveFinanceSettings(payload = {}) {
  const { data } = await api.put('/finance/settings', payload)
  return data?.settings || null
}

export async function fetchFinanceCategories(params = {}) {
  const { data } = await api.get('/finance/categories', { params })
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function createFinanceCategory(payload = {}) {
  const { data } = await api.post('/finance/categories', payload)
  return data?.category || null
}

export async function updateFinanceCategory(id, payload = {}) {
  const { data } = await api.patch(`/finance/categories/${id}`, payload)
  return data?.category || null
}

export async function deleteFinanceCategory(id) {
  const { data } = await api.delete(`/finance/categories/${id}`)
  return Boolean(data?.ok)
}

export async function fetchFinanceExpenses(params = {}) {
  const { data } = await api.get('/finance/expenses', { params })
  return {
    expenses: Array.isArray(data?.expenses) ? data.expenses : [],
    totals: data?.totals || { count: 0, amount: 0 }
  }
}

export async function createFinanceExpense(payload = {}) {
  const { data } = await api.post('/finance/expenses', payload)
  return data?.expense || null
}

export async function updateFinanceExpense(id, payload = {}) {
  const { data } = await api.patch(`/finance/expenses/${id}`, payload)
  return data?.expense || null
}

export async function deleteFinanceExpense(id) {
  const { data } = await api.delete(`/finance/expenses/${id}`)
  return Boolean(data?.ok)
}

export async function fetchFinanceLiabilities(params = {}) {
  const { data } = await api.get('/finance/liabilities', { params })
  return {
    liabilities: Array.isArray(data?.liabilities) ? data.liabilities : [],
    totals: data?.totals || { count: 0, amount: 0, outstanding: 0 }
  }
}

export async function createLiabilityIntake(payload = {}) {
  const { data } = await api.post('/finance/liabilities/intake', payload)
  return {
    liability: data?.liability || null,
    income: data?.income || null
  }
}

export async function repayLiability(liabilityId, payload = {}) {
  const { data } = await api.post(`/finance/liabilities/${liabilityId}/repay`, payload)
  return {
    liability: data?.liability || null,
    repayment: data?.repayment || null,
    expense: data?.expense || null
  }
}

export async function fetchFinanceReports(params = {}) {
  const { data } = await api.get('/finance/reports', { params })
  return {
    type: String(data?.type || 'balance-sheet'),
    rows: Array.isArray(data?.rows) ? data.rows : [],
    totals: data?.totals || { income: 0, expense: 0, liabilities: 0, balance: 0 }
  }
}