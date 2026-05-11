import { api } from './api'

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function fetchFeesSummary(params = {}) {
  const { data } = await api.get('/fees/summary', { params })
  return {
    totalStudents: toNumber(data?.totalStudents),
    paidThisMonth: toNumber(data?.paidThisMonth),
    pendingCount: toNumber(data?.pendingCount),
    totalCollected: toNumber(data?.totalCollected),
    incomingFeeThisMonth: toNumber(data?.incomingFeeThisMonth),
    pendingLiabilityThisMonth: toNumber(data?.pendingLiabilityThisMonth),
    monthlySeries: Array.isArray(data?.monthlySeries) ? data.monthlySeries : []
  }
}

export async function generateMonthlyFees(payload = {}) {
  const { data } = await api.post('/fees/generate-monthly', payload)
  return {
    ok: Boolean(data?.ok),
    month: String(data?.month || ''),
    createdCount: toNumber(data?.createdCount),
    totalCandidates: toNumber(data?.totalCandidates),
    scope: data?.scope || { class: null, section: null }
  }
}

export async function fetchFeeDefaulters(filters = {}) {
  const { data } = await api.get('/fees/defaulters', { params: filters })
  return Array.isArray(data) ? data : []
}

export async function fetchFeeRecords(filters = {}) {
  const { data } = await api.get('/fees/records', { params: filters })
  return Array.isArray(data) ? data : []
}

export async function fetchFeeDetails(id, params = {}) {
  const studentId = String(id || '').trim() || 'self'
  const query = { ...params }
  if (studentId !== 'self') {
    query.studentId = studentId
  }

  const path = `/fees/details/${studentId}`
  const { data } = await api.get(path, { params: query })
  return {
    student: data?.student || {},
    feeInfo: data?.feeInfo || {},
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    summary: data?.summary || {
      period: { preset: 'all', from: null, to: null },
      totals: { paid: 0, due: 0, total: 0 },
      monthlyRows: [],
      yearlyRows: [],
      transactionCount: 0,
      allTransactionCount: 0
    }
  }
}

export async function updateFeeStatus(feeId, status) {
  const { data } = await api.patch(`/fees/${feeId}/status`, { status })
  return data?.fee
}

export async function fetchFeeStructure() {
  return {
    regularFees: [
      { label: 'Annual', amount: 500 },
      { label: 'Admission', amount: 1000 }
    ],
    tuition: {
      type: 'Monthly',
      levels: {
        'Pre-Primary': 2000,
        Primary: 3000,
        Middle: 4000
      }
    }
  }
}

export async function getFeeVoucherTemplate() {
  const { data } = await api.get('/fees/voucher-template')
  return data?.template || null
}

export async function saveFeeVoucherTemplate(payload = {}) {
  const { data } = await api.put('/fees/voucher-template', payload)
  return data?.template || null
}
