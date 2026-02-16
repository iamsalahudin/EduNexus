'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRef } from 'react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const emailRef = useRef(null)
  const passRef = useRef(null)

  function roleToPath(role) {
    const map = {
      Admin: 'admin',
      Principal: 'principal',
      Teacher: 'teacher',
      Student: 'student',
      Parent: 'parent',
      HR: 'hr',
      Finance: 'finance',
      Reception: 'reception',
    }
    if (!role) return 'admin'
    return map[role] || String(role).toLowerCase()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const email = form.get('email')
    const password = form.get('password')

    try {
      const result = await login({ email, password })
      const rolePath = roleToPath(result?.user?.role)
      router.push(`/${rolePath}`)
    } catch (err) {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Sign in to EduNexus</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='admin@edu.com'; if(passRef.current) passRef.current.value='admin@123' }} className="px-3 py-1 border rounded text-sm">Admin</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='principal@edu.com'; if(passRef.current) passRef.current.value='principal@123' }} className="px-3 py-1 border rounded text-sm">Principal</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='teacher@edu.com'; if(passRef.current) passRef.current.value='teacher@123' }} className="px-3 py-1 border rounded text-sm">Teacher</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='student@edu.com'; if(passRef.current) passRef.current.value='student@123' }} className="px-3 py-1 border rounded text-sm">Student</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='parent@edu.com'; if(passRef.current) passRef.current.value='parent@123' }} className="px-3 py-1 border rounded text-sm">Parent</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='hr@edu.com'; if(passRef.current) passRef.current.value='hr@123' }} className="px-3 py-1 border rounded text-sm">HR</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='finance@edu.com'; if(passRef.current) passRef.current.value='finance@123' }} className="px-3 py-1 border rounded text-sm">Finance</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='reception@edu.com'; if(passRef.current) passRef.current.value='reception@123' }} className="px-3 py-1 border rounded text-sm">Reception</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input ref={emailRef} name="email" type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input ref={passRef} name="password" type="password" required className="w-full border rounded px-3 py-2" />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <button className="w-full py-2 btn-primary rounded" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
