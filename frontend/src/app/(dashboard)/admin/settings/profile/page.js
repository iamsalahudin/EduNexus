"use client"

import { useEffect, useState } from 'react'
import Skeleton from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { userService } from '@/services/user.service'

export default function ProfileSettings() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [form, setForm] = useState({ name: '', email: '' })

	useEffect(() => {
		setForm({
			name: user?.name || '',
			email: user?.email || ''
		})
	}, [user])

	async function handleSave(e) {
		e.preventDefault()
		setError('')
		setSuccess('')
		const id = user?.id || user?._id
		if (!id) {
			setError('Missing user id')
			return
		}

		setSaving(true)
		try {
			await userService.updateUser(id, { name: form.name, email: form.email })
			setSuccess('Profile updated')
		} catch (e2) {
			setError(e2?.response?.data?.error || e2?.response?.data?.message || e2?.message || 'Failed to update profile')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold">Profile</h1>
				<p className="text-sm text-gray-600 mt-1">Update your account profile.</p>
			</div>

			<div className="card max-w-2xl">
				{loading ? (
					<Skeleton className="h-40" />
				) : (
					<form onSubmit={handleSave} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<div className="text-gray-600">Role</div>
								<div className="font-medium">{user?.role || '-'}</div>
							</div>
							<div>
								<div className="text-gray-600">Active</div>
								<div className="font-medium">{user?.active === false ? 'No' : 'Yes'}</div>
							</div>
						</div>

						<div>
							<label className="block text-sm mb-1">Name</label>
							<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full" />
						</div>

						<div>
							<label className="block text-sm mb-1">Email</label>
							<input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full" />
						</div>

						{error ? <div className="text-red-500 text-sm">{error}</div> : null}
						{success ? <div className="text-green-600 text-sm">{success}</div> : null}

						<button type="submit" className="px-3 py-2 btn-primary rounded" disabled={saving}>
							{saving ? 'Saving...' : 'Save changes'}
						</button>
					</form>
				)}
			</div>
		</div>
	)
}
