"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { userService } from '@/services/user.service'
import { Button, ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'

export default function UserDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const data = await userService.getUser(id)
        if (mounted) setUser(data?.user || null)
      } catch (e) {
        if (mounted) setError(e?.response?.data?.error || e?.message || 'Failed to load user')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  async function handleDelete() {
    if (!id) return
    const ok = window.confirm('Delete this user?')
    if (!ok) return
    setDeleting(true)
    setError('')
    try {
      await userService.deleteUser(id)
      router.push('/admin/users')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Detail"
        subtitle="View user profile and status."
        right={
          <div className="flex gap-2">
            <ButtonLink href={`/admin/users/update?id=${encodeURIComponent(String(id || ''))}`} variant="secondary">
              Edit
            </ButtonLink>
            <Button
              type="button"
              variant="outline"
              style={{ borderColor: 'var(--color-cta)', color: 'var(--color-cta)' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      />

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <Card>
        {loading ? (
          <Skeleton className="h-40" />
        ) : !user ? (
          <div className="text-sm">User not found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Name</div>
              <div className="font-medium">{user.name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600">Email</div>
              <div className="font-medium">{user.email || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600">Role</div>
              <div className="font-medium">{user.role || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600">Active</div>
              <div className="font-medium">{user.active === false ? 'No' : 'Yes'}</div>
            </div>
            <div>
              <div className="text-gray-600">Created</div>
              <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</div>
            </div>
            <div>
              <div className="text-gray-600">Updated</div>
              <div className="font-medium">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-600">User ID</div>
              <div className="font-mono text-xs break-all">{user._id || id}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

