import {
  Play,
  Download,
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Award,
  ArrowRight,
} from 'lucide-react'

const transcript = [
  { role: 'Vendedor', time: '0:10', sentiment: 'Normal', sentimentColor: 'amber', text: 'Me alegra mucho escuchar eso...', confidence: 95 },
  { role: 'Cliente', time: '0:36', sentiment: 'Objeción', sentimentColor: 'red', text: 'Pues sí, mandé un mensaje...', confidence: 95 },
]

export function InboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card rounded-xl border border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Bandeja de entrada</h1>
            <p className="text-xs text-muted-foreground">Auditorías pendientes de revisión</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[420px_1fr] gap-6">
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Reproductor</h2>
            <div className="flex items-center gap-3 mt-4">
              <button className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              </button>
              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[15%] bg-primary rounded-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-lg font-bold text-foreground mb-4">Transcripción</h2>
          <div className="space-y-4 max-h-[480px] overflow-y-auto">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'Cliente' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-foreground">{msg.role}</span>
                  <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                </div>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${msg.role === 'Cliente' ? 'bg-pink-light/40' : 'bg-muted'}`}>
                  <p className="text-sm text-foreground">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Resumen</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-foreground">Llamada revisada</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Seguimiento CRM</span>
          </div>
        </div>
      </div>
    </div>
  )
}
