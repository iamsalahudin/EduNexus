"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/auth.service'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Initialize auth on mount: check if user has valid token
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          // Token exists, fetch current user
          const userData = await authService.me()
          setUser(userData.user)
        }
      } catch (err) {
        // Token invalid or expired, clear it
        localStorage.removeItem('accessToken')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  /**
   * Login: Send credentials to backend, get JWT token
   */
  async function login({ email, password }){
    try {
      setError(null)
      setLoading(true)
      const response = await authService.login({ email, password })
      
      // Store token
      localStorage.setItem('accessToken', response.accessToken)
      
      // Fetch and set user data
      const meData = await authService.me()
      setUser(meData.user)
      
      return { success: true, user: meData.user }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed'
      setError(message)
      setUser(null)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout: Clear token and user data
   */
  async function logout(){
    try {
      setLoading(true)
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
      setLoading(false)
    }
  }

  /**
   * Refresh token (useful for maintaining session)
   */
  async function refresh(){
    try {
      const response = await authService.refresh()
      localStorage.setItem('accessToken', response.accessToken)
      return response
    } catch (err) {
      logout()
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      login, 
      logout,
      refresh,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(){
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
