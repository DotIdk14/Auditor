import {
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  Plus,
  Check,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const kanbanColumns = [
  {
    id: 'todo',
    title: 'Por auditar',
    dot: 'bg-purple-tag',
    cards: [
      { id: '1', agent: 'Leonardo Sámsul', initial: 'L', type: 'CALIDAD', typeColor: 'purple' as const, title: 'Llamada #1284 — Cliente premium' },
      { id: '2', agent: 'Bayu Salto', initial: 'B', type: 'EXPERIENCIA', typeColor: 'pink' as const, title: 'Llamada #1290 — Renovación plan' },
      { id: '3', agent: 'Padhang Sattrio', initial: 'P', type: 'CUMPLIMIENTO', typeColor: 'blue' as const, title: 'Llamada #1301 — Cobranza' },
    ],
  },
  {
    id: 'review',
    title: 'En revisión',
    dot: 'bg-pink-tag',
    cards: [
      { id: '4', agent: 'Sir Dandy', initial: 'S', type: 'CALIDAD', typeColor: 'purple' as const, title: 'Llamada #1276 — Soporte técnico' },
      { id: '5', agent: 'Jhon Tosan', initial: 'J', type: 'EXPERIENCIA', typeColor: 'pink' as const, title: 'Llamada #1281 — Reclamo cliente' },
    ],
  },
  {
    id: 'done',
    title: 'Completadas',
    dot: 'bg-blue-tag',
    cards: [
      { id: '6', agent: 'Bagas Mahpie', initial: 'B', type: 'CUMPLIMIENTO', typeColor: 'blue' as const, title: 'Llamada #1270 — Verificación KYC' },
      { id: '7', agent: 'Zakir Horizontal', initial: 'Z', type: 'CALIDAD', typeColor: 'purple' as const, title: 'Llamada #1265 — Venta cruzada' },
    ],
  },
]

const chartData = [
  { range: '1-10 Ago', value: 20 },
  { range: '11-20 Ago', value: 50 },
  { range: '21-30 Ago', value: 60 },
]

const lessons = [
  { avatar: 'P', name: 'Padhang Sattrio', date: '16/02/2024', type: 'CALIDAD', desc: 'Revisión de saludo y despedida', score: 87 },
  { avatar: 'B', name: 'Bayu Salto', date: '15/02/2024', type: 'EXPERIENCIA', desc: 'Tono empático en reclamo', score: 92 },
  { avatar: 'L', name: 'Leonardo Sámsul', date: '14/02/2024', type: 'CUMPLIMIENTO', desc: 'Lectura de disclaimer legal', score: 64 },
  { avatar: 'S', name: 'Sir Dandy', date: '13/02/2024', type: 'CALIDAD', desc: 'Resolución en primera llamada', score: 48 },
]

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700'
  if (score >= 65) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export function HomePage() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
          <div className="relative z-10 max-w-md">
            <h1 className="text-2xl font-bold leading-snug mb-4">Panel de Control</h1>
            <p className="text-sm opacity-90">Bienvenido al sistema de auditoría de calidad</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pendientes</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {kanbanColumns.map((col) => (
              <div key={col.id} className="bg-muted/40 rounded-xl p-3 flex flex-col gap-3 min-h-[260px]">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold text-foreground">{col.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-card rounded-full px-2 py-0.5">
                      {col.cards.length}
                    </span>
                  </div>
                  <button className="w-6 h-6 rounded-md hover:bg-card flex items-center justify-center text-muted-foreground">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {col.cards.map((card) => (
                    <div key={card.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          card.typeColor === 'purple' ? 'bg-purple-light text-purple-tag' :
                          card.typeColor === 'pink' ? 'bg-pink-light text-pink-tag' :
                          'bg-blue-light text-blue-tag'
                        }`}>{card.type}</span>
                        {col.id === 'done' ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </span>
                        ) : (
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-foreground leading-snug mb-3 line-clamp-2">{card.title}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">{card.initial}</div>
                        <p className="text-[11px] font-medium text-foreground">{card.agent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Tus auditorías</h2>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1.4fr_110px_1.6fr_90px_60px] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Agente</span><span>Tipo</span><span>Descripción</span><span>Calidad</span><span className="text-right">Acción</span>
            </div>
            {lessons.map((lesson) => (
              <div key={lesson.desc} className="grid grid-cols-[1.4fr_110px_1.6fr_90px_60px] px-4 py-3 items-center border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{lesson.avatar}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{lesson.name}</p>
                    <p className="text-xs text-muted-foreground">{lesson.date}</p>
                  </div>
                </div>
                <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-light text-purple-tag w-fit">{lesson.type}</span>
                <p className="text-sm text-foreground truncate pr-4">{lesson.desc}</p>
                <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-1 rounded-md w-fit ${scoreColor(lesson.score)}`}>{lesson.score}%</span>
                <button className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors justify-self-end">
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-72 shrink-0 space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">Estadísticas</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={index === 1 ? 'var(--primary)' : 'var(--purple-light)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </aside>
    </div>
  )
}
