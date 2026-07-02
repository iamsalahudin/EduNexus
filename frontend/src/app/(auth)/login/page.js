'use client';

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const usernameRef = useRef(null)
  const passRef = useRef(null)

  function roleToPath(role) {
    const map = {
      Admin: 'admin',
      Principal: 'principal',
      Teacher: 'teacher',
      Student: 'student',
      Parent: 'parent',
      HR: 'hr',
      Finance: 'accountant',
      Reception: 'receptionist',
    }
    if (!role) return 'admin'
    return map[role] || String(role).toLowerCase()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const username = form.get('username')
    const password = form.get('password')

    try {
      const result = await login({ username, password })
      const rolePath = roleToPath(result?.user?.role)
      router.push(`/${rolePath}`)
    } catch (err) {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Use your institutional account to access EduNexus
        </p>
      </div>

      <div className="hidden sm:grid grid-cols-4 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'admin'
            if (passRef.current) passRef.current.value = 'admin@123'
          }}
        >
          Admin
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'principal'
            if (passRef.current) passRef.current.value = 'principal@123'
          }}
        >
          Principal
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'teacher'
            if (passRef.current) passRef.current.value = 'teacher@123'
          }}
        >
          Teacher
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'student'
            if (passRef.current) passRef.current.value = 'student@123'
          }}
        >
          Student
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'parent'
            if (passRef.current) passRef.current.value = 'parent@123'
          }}
        >
          Parent
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'hr'
            if (passRef.current) passRef.current.value = 'hr@123'
          }}
        >
          HR
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'finance'
            if (passRef.current) passRef.current.value = 'finance@123'
          }}
        >
          Finance
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (usernameRef.current) usernameRef.current.value = 'reception'
            if (passRef.current) passRef.current.value = 'reception@123'
          }}
        >
          Reception
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input ref={usernameRef} name="username" label="Username" required />
        <Input ref={passRef} name="password" type="password" label="Password" required />
        <div className="text-right text-sm">
          <button
            type="button"
            className="underline underline-offset-1 text-grey-600"
            onClick={() => {
              const uname = usernameRef.current?.value || '';
              const emailParam = uname.includes('@') ? uname : '';
              const query = new URLSearchParams();
              if (uname) query.set('username', uname);
              if (emailParam) query.set('email', emailParam);
              router.push(`/forgot-password?${query.toString()}`);
            }}
          >
            Forgot password?
          </button>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 dark:bg-transparent dark:text-red-400 p-2 rounded">
            {error}
          </div>
        )}
        <Button className="w-full" variant="primary" disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
