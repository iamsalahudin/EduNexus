<<<<<<< HEAD
import { api } from './api'

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function fetchSalarySummary(params = {}) {
  const { data } = await api.get('/salary/summary', { params })
  return {
    periodMonth: String(data?.periodMonth || ''),
    staffCount: toNumber(data?.staffCount),
    slipCount: toNumber(data?.slipCount),
    paidCount: toNumber(data?.paidCount),
    pendingCount: toNumber(data?.pendingCount),
    totalPayroll: toNumber(data?.totalPayroll),
    paidAmount: toNumber(data?.paidAmount),
    advanceTotal: toNumber(data?.advanceTotal),
    monthlySeries: Array.isArray(data?.monthlySeries) ? data.monthlySeries : []
  }
}

export async function fetchSalaryStaff(params = {}) {
  const { data } = await api.get('/salary/staff', { params })
  return Array.isArray(data?.staff) ? data.staff : []
}

export async function upsertSalaryStaff(payload, id = '') {
  const path = id ? `/salary/staff/${id}` : '/salary/staff'
  const method = id ? 'patch' : 'post'
  const { data } = await api[method](path, payload)
  return data?.staff || null
}

export async function fetchSalaryStructures() {
  const { data } = await api.get('/salary/structures')
  return Array.isArray(data?.structures) ? data.structures : []
}

export async function upsertSalaryStructure(payload, id = '') {
  const path = id ? `/salary/structures/${id}` : '/salary/structures'
  const method = id ? 'patch' : 'post'
  const { data } = await api[method](path, payload)
  return data?.structure || null
}

export async function generateMonthlySalary(payload = {}) {
  const { data } = await api.post('/salary/generate-monthly', payload)
  return data
}

export async function fetchSalaryRecords(params = {}) {
  const { data } = await api.get('/salary/records', { params })
  return {
    records: Array.isArray(data?.records) ? data.records : [],
    periodMonth: String(data?.periodMonth || ''),
    range: data?.range || ''
  }
}

export async function updateSalaryStatus(id, status) {
  const { data } = await api.patch(`/salary/slips/${id}/status`, { status })
  return data?.slip || null
}

export async function addSalaryAdvance(id, payload) {
  const { data } = await api.post(`/salary/slips/${id}/advance`, payload)
  return data?.slip || null
}

export async function fetchSalaryReports(params = {}) {
  const { data } = await api.get('/salary/reports', { params })
  return {
    totals: data?.totals || { totalPaid: 0, totalNet: 0, totalAdvance: 0, slipCount: 0 },
    rows: Array.isArray(data?.rows) ? data.rows : [],
    periodMonth: String(data?.periodMonth || '')
  }
}

export async function fetchSalarySlipPdf(id) {
  const response = await api.get(`/salary/slips/${id}/pdf`, { responseType: 'blob' })
  return response.data
=======
import { api } from './api'

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export async function fetchSalarySummary(params = {}) {
  const { data } = await api.get('/salary/summary', { params })
  return {
    periodMonth: String(data?.periodMonth || ''),
    staffCount: toNumber(data?.staffCount),
    slipCount: toNumber(data?.slipCount),
    paidCount: toNumber(data?.paidCount),
    pendingCount: toNumber(data?.pendingCount),
    totalPayroll: toNumber(data?.totalPayroll),
    paidAmount: toNumber(data?.paidAmount),
    advanceTotal: toNumber(data?.advanceTotal),
    monthlySeries: Array.isArray(data?.monthlySeries) ? data.monthlySeries : []
  }
}

export async function fetchSalaryStaff(params = {}) {
  const { data } = await api.get('/salary/staff', { params })
  return Array.isArray(data?.staff) ? data.staff : []
}

export async function upsertSalaryStaff(payload, id = '') {
  const path = id ? `/salary/staff/${id}` : '/salary/staff'
  const method = id ? 'patch' : 'post'
  const { data } = await api[method](path, payload)
  return data?.staff || null
}

export async function fetchSalaryStructures() {
  const { data } = await api.get('/salary/structures')
  return Array.isArray(data?.structures) ? data.structures : []
}

export async function upsertSalaryStructure(payload, id = '') {
  const path = id ? `/salary/structures/${id}` : '/salary/structures'
  const method = id ? 'patch' : 'post'
  const { data } = await api[method](path, payload)
  return data?.structure || null
}

export async function generateMonthlySalary(payload = {}) {
  const { data } = await api.post('/salary/generate-monthly', payload)
  return data
}

export async function fetchSalaryRecords(params = {}) {
  const { data } = await api.get('/salary/records', { params })
  return {
    records: Array.isArray(data?.records) ? data.records : [],
    periodMonth: String(data?.periodMonth || ''),
    range: data?.range || ''
  }
}

export async function updateSalaryStatus(id, status) {
  const { data } = await api.patch(`/salary/slips/${id}/status`, { status })
  return data?.slip || null
}

export async function addSalaryAdvance(id, payload) {
  const { data } = await api.post(`/salary/slips/${id}/advance`, payload)
  return data?.slip || null
}

export async function fetchSalaryReports(params = {}) {
  const { data } = await api.get('/salary/reports', { params })
  return {
    totals: data?.totals || { totalPaid: 0, totalNet: 0, totalAdvance: 0, slipCount: 0 },
    rows: Array.isArray(data?.rows) ? data.rows : [],
    periodMonth: String(data?.periodMonth || '')
  }
}

export async function fetchSalarySlipPdf(id) {
  const response = await api.get(`/salary/slips/${id}/pdf`, { responseType: 'blob' })
  return response.data
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}