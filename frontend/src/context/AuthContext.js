"use client"
import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    // Mocked user for demo; in real app read from cookie or fetch
    return { name: 'Admin User', role: 'admin' }
  })

  async function login({ email, password }){
    // mock auth; replace with real API call
    if(email && password){
      const lower = (email||'').toLowerCase()
      let role = 'admin'
      if(lower.includes('principal')) role = 'principal'
      else if(lower.includes('teacher')) role = 'teacher'
      else if(lower.includes('student')) role = 'student'
      else if(lower.includes('parent')) role = 'parent'
      else if(lower.includes('hr')) role = 'hr'
      else if(lower.includes('finance')) role = 'finance'
      else if(lower.includes('reception')) role = 'reception'
      setUser({ name: (role+' User'), role })
      return { token: 'mock-jwt' }
    }
    throw new Error('Invalid')
  }

  function logout(){
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}
