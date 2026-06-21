import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import type { AuthSession } from './types'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const session: AuthSession = {
  token: localStorage.getItem('utel_supervisor_token') || '',
  user: localStorage.getItem('utel_supervisor_user') || 'Supervisor',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App session={session} apiUrl={API_URL} />
  </StrictMode>,
)
