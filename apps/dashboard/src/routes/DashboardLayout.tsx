import { Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navOverview = [
  { icon: LayoutDashboard, label: 'Inicio', to: '/' },
  { icon: Inbox, label: 'Auditor', to: '/inbox' },
  { icon: BookOpen, label: 'Auditorías', to: '/auditor' },
  { icon: ClipboardList, label: 'Tareas', to: '/task' },
  { icon: Users, label: 'Equipo', to: '/group' },
]

const navSettings = [
  { icon: Settings, label: 'Ajustes', to: '/settings' },
]

const friends = [
  { name: 'Bagas Mahpie', role: 'Coordinador' },
  { name: 'Sir Dandy', role: 'Agente' },
  { name: 'Jhon Tosan', role: 'Agente' },
]

export function DashboardLayout() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            +
          </div>
          <span className="text-lg font-bold text-foreground">Visor</span>
        </div>

        <div className="px-6 mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            General
          </p>
          <nav className="space-y-1">
            {navOverview.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="w-[18px] h-[18px] text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-6 mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Equipo
          </p>
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {friend.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">{friend.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-6 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Ajustes
          </p>
          <nav className="space-y-1">
            {navSettings.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="w-[18px] h-[18px] text-muted-foreground" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors w-full"
            >
              <LogOut className="w-[18px] h-[18px] text-muted-foreground" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar llamadas, agentes o auditorías..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
              <MessageSquare className="w-[18px] h-[18px] text-muted-foreground" />
            </button>
            <button className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors">
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-2 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                U
              </div>
              <span className="text-sm font-semibold text-foreground">Usuario</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 pb-6 pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
