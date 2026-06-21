import { useAuth } from '../contexts/AuthContext'
import { AuditoriasMain } from '@super/auditorias'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function AuditorPage() {
  const { session, logout } = useAuth()

  if (!session) return null

  return (
    <AuditoriasMain
      session={session}
      apiUrl={API_URL}
      onLogout={logout}
    />
  )
}
