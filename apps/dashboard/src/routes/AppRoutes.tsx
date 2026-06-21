import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from './DashboardLayout'
import { HomePage } from './HomePage'
import { InboxPage } from './InboxPage'
import { AuditorPage } from './AuditorPage'
import { LoginScreen } from '@super/auditorias'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#0a0a0a', color: '#f87171', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{(this.state.error as Error).stack || (this.state.error as Error).message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function AppRoutes() {
  const { isAuthenticated, isLoading, login } = useAuth()

  return (
    <ErrorBoundary>
      {isLoading ? (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : !isAuthenticated ? (
        <LoginScreen onLoginSuccess={(token, user) => login(token, user)} />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route index element={<HomePage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="auditor" element={<AuditorPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </ErrorBoundary>
  )
}
