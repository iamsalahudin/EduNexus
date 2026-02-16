import { api } from './api'

export const userService = {
	listUsers: async () => {
		const { data } = await api.get('/users')
		return data
	},

	getUser: async (id) => {
		const { data } = await api.get(`/users/${id}`)
		return data
	},

	createUser: async (payload) => {
		// Admin-only (or other role-specific restrictions) enforced by backend
		const { data } = await api.post('/auth/register', payload)
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
