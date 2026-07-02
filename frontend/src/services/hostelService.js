import { api } from './api'

export const hostelService = {
  listHostels: async (params = undefined) => {
    const { data } = await api.get('/hostel/hostels', params ? { params } : undefined)
    return data
  },

  createHostel: async (payload) => {
    const { data } = await api.post('/hostel/hostels', payload)
    return data
  },

  updateHostel: async (id, payload) => {
    const { data } = await api.patch(`/hostel/hostels/${id}`, payload)
    return data
  },

  deleteHostel: async (id) => {
    const { data } = await api.delete(`/hostel/hostels/${id}`)
    return data
  },

  listRooms: async (params = undefined) => {
    const { data } = await api.get('/hostel/rooms', params ? { params } : undefined)
    return data
  },

  createRoom: async (payload) => {
    const { data } = await api.post('/hostel/rooms', payload)
    return data
  },

  updateRoom: async (id, payload) => {
    const { data } = await api.patch(`/hostel/rooms/${id}`, payload)
    return data
  },

  deleteRoom: async (id) => {
    const { data } = await api.delete(`/hostel/rooms/${id}`)
    return data
  },

  listResidents: async (params = undefined) => {
    const { data } = await api.get('/hostel/residents', params ? { params } : undefined)
    return data
  },

  getResidentById: async (id) => {
    const { data } = await api.get(`/hostel/residents/${id}`)
    return data
  },

  createResident: async (payload) => {
    const { data } = await api.post('/hostel/residents', payload)
    return data
  },

  updateResident: async (id, payload) => {
    const { data } = await api.patch(`/hostel/residents/${id}`, payload)
    return data
  },

  deleteResident: async (id) => {
    const { data } = await api.delete(`/hostel/residents/${id}`)
    return data
  },

  listFees: async (params = undefined) => {
    const { data } = await api.get('/hostel/fees', params ? { params } : undefined)
    return data
  },

  createFee: async (payload) => {
    const { data } = await api.post('/hostel/fees', payload)
    return data
  },

  payFee: async (id, payload) => {
    const { data } = await api.patch(`/hostel/fees/${id}/pay`, payload)
    return data
  }
}

export default hostelService
