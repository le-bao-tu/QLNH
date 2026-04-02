'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { set } from 'zod'

// ⚡ DEV ONLY: Đặt thành null để bật tính năng đăng nhập thật
const FAKE_USER: User | null = null

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

interface RegisterData {
  username: string
  email: string
  password: string
  fullName: string
  restaurantName: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Nếu đã có FAKE_USER thì bỏ qua restore từ localStorage
    if (FAKE_USER) {
      setIsLoading(false)
      return
    }
    const restore = async () => {
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          setUser(JSON.parse(stored))
        }
      } catch (err) {
        console.error('Failed to restore session', err)
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { username, password })
      if (data.token) {
        localStorage.setItem('accessToken', data.token)
        const userData: User = {
          id: parseJwt(data.token)?.nameid || '',
          username,
          email: parseJwt(data.token)?.email || '',
          fullName: parseJwt(data.token)?.fullName || username,
          role: parseJwt(data.token)?.role || 'User',
        }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    await api.post('/api/auth/register', data)
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function parseJwt(token: string): Record<string, string> | null {
  try {
    const base64 = token.split('.')[1]
    const decoded = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
    // .NET JWT uses long claim names
    return {
      nameid: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      fullName: decoded['fullName'],
    }
  } catch { return null }
}
