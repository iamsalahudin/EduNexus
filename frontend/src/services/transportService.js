import { api } from './api'

const transportService = {
  listRoutes: async (params = undefined) => {
    const { data } = await api.get('/transport/routes', params ? { params } : undefined)
    return data
  },

  createRoute: async (payload) => {
    const { data } = await api.post('/transport/routes', payload)
    return data
  },

  updateRoute: async (routeId, payload) => {
    const { data } = await api.patch(`/transport/routes/${routeId}`, payload)
    return data
  },

  deleteRoute: async (routeId) => {
    const { data } = await api.delete(`/transport/routes/${routeId}`)
    return data
  },

  listEnrollments: async (params = undefined) => {
    const { data } = await api.get('/transport/enrollments', params ? { params } : undefined)
    return data
  },

  createEnrollment: async (payload) => {
    const { data } = await api.post('/transport/enrollments', payload)
    return data
  },

  updateEnrollment: async (enrollmentId, payload) => {
    const { data } = await api.patch(`/transport/enrollments/${enrollmentId}`, payload)
    return data
  },

  deleteEnrollment: async (enrollmentId) => {
    const { data } = await api.delete(`/transport/enrollments/${enrollmentId}`)
    return data
  },

  listRequests: async (params = undefined) => {
    const { data } = await api.get('/transport/requests', params ? { params } : undefined)
    return data
  },

  createRequest: async (payload) => {
    const { data } = await api.post('/transport/requests', payload)
    return data
  },

  updateRequestStatus: async (requestId, payload) => {
    const { data } = await api.patch(`/transport/requests/${requestId}/status`, payload)
    return data
  },

  listPayments: async (params = undefined) => {
    const { data } = await api.get('/transport/payments', params ? { params } : undefined)
    return data
  },

  createPayment: async (payload) => {
    const { data } = await api.post('/transport/payments', payload)
    return data
  },

  updatePayment: async (paymentId, payload) => {
    const { data } = await api.patch(`/transport/payments/${paymentId}`, payload)
    return data
  },

  deletePayment: async (paymentId) => {
    const { data } = await api.delete(`/transport/payments/${paymentId}`)
    return data
  },

  getPaymentSummaryReport: async (params = undefined) => {
    const { data } = await api.get('/transport/reports/payment-summary', params ? { params } : undefined)
    return data
  },

  getDefaultersReport: async (params = undefined) => {
    const { data } = await api.get('/transport/reports/defaulters', params ? { params } : undefined)
    return data
  },

  getRouteCountsReport: async (params = undefined) => {
    const { data } = await api.get('/transport/reports/route-counts', params ? { params } : undefined)
    return data
  },

  getRevenueTrendReport: async (params = undefined) => {
    const { data } = await api.get('/transport/reports/revenue-trend', params ? { params } : undefined)
    return data
  },

  exportPaymentsCsvUrl: (params = undefined) => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '')
    const url = new URL(`${base}/transport/reports/payments/export.csv`)
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== '') url.searchParams.set(k, String(v))
      })
    }
    return url.toString()
  },

  listParentChildren: async () => {
    const { data } = await api.get('/transport/parent/children')
    return data
  }
}

export default transportService
