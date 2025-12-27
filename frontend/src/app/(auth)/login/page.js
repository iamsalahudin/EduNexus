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

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const email = form.get('email')
    const password = form.get('password')

    try {
      await login({ email, password })
      // determine role from email (simple mapping for mock)
      const lower = (email || '').toLowerCase()
      let role = 'admin'
      if (lower.includes('principal')) role = 'principal'
      else if (lower.includes('teacher')) role = 'teacher'
      else if (lower.includes('student')) role = 'student'
      else if (lower.includes('parent')) role = 'parent'
      else if (lower.includes('hr')) role = 'hr'
      else if (lower.includes('finance')) role = 'finance'
      else if (lower.includes('reception')) role = 'reception'
      // push to role root (e.g. /admin, /teacher) to match app route grouping
      router.push(`/${role}`)
    } catch (err) {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Sign in to EduNexus</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='admin@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Admin</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='principal@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Principal</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='teacher@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Teacher</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='student@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Student</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='parent@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Parent</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='hr@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">HR</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='finance@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Finance</button>
        <button type="button" onClick={()=>{ if(emailRef.current) emailRef.current.value='reception@edunexus.test'; if(passRef.current) passRef.current.value='password' }} className="px-3 py-1 border rounded text-sm">Reception</button>
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
