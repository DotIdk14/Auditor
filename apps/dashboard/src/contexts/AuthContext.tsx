import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthSession } from '@super/auditorias'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('utel_supervisor_token')
    const user = localStorage.getItem('utel_supervisor_user')

    if (!token) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    fetch(`${API_URL}/api/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSession({ token, user: user || 'Supervisor' })
        } else {
          localStorage.removeItem('utel_supervisor_token')
          localStorage.removeItem('utel_supervisor_user')
        }
      })
      .catch(() => {
        // Si el server no responde, usar sesión local
        setSession({ token, user: user || 'Supervisor' })
      })
      .finally(() => {
        clearTimeout(timeout)
        setIsLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const login = (token: string, user: string) => {
    localStorage.setItem('utel_supervisor_token', token)
    localStorage.setItem('utel_supervisor_user', user)
    setSession({ token, user })
  }

  const logout = () => {
    localStorage.removeItem('utel_supervisor_token')
    localStorage.removeItem('utel_supervisor_user')
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { API_URL }
