import { api } from './api'

export const userService = {
	listUsers: async (params = undefined) => {
		const { data } = await api.get('/users', params ? { params } : undefined)
		return data
	},

	getUser: async (id) => {
		const { data } = await api.get(`/users/${id}`)
		return data
	},

	createUser: async (payload) => {
		// Admin-only enforced by backend
		const { data } = await api.post('/users', payload)
		return data
	},

	updateUser: async (id, payload) => {
		const { data } = await api.patch(`/users/${id}`, payload)
		return data
	},

	deleteUser: async (id) => {
		const { data } = await api.delete(`/users/${id}`)
		return data
	}
}

export default userService
