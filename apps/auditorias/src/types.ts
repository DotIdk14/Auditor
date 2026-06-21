export interface AuthSession {
  token: string
  user: string
}

export interface AuditoriasMainProps {
  session: AuthSession
  apiUrl: string
  onLogout?: () => void
}

export interface TranscriptionUtterance {
  speaker: 'Vendedor' | 'Cliente'
  start: number
  end: number
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface UtelSubItem {
  id: string
  name: string
  weight: number
  checked: boolean
}

export interface UtelChecklistItem {
  id: string
  title: string
  weight: number
  score: number
  status: 'passed' | 'failed'
  feedback: string
  subitems: UtelSubItem[]
}

export interface UtelAnalysis {
  totalScore: number
  isCompliant: boolean
  checkedItemsCount: number
  modalidadDetectada: string
  evaluacion_detallada: Record<string, string>
  checklist: UtelChecklistItem[]
}

export interface EmotionalAnalysis {
  primaryEmotion?: string
  emotionalJourney?: string
  purchaseAptitudeScore?: number
  purchaseAptitudeLabel?: string
  barriersToPurchase?: string[]
  buyingSignals?: string[]
  aptitudeReason?: string
}

export interface SalesCallMetadata {
  fileName: string
  url?: string
  size?: number
  duration: number
  uploadedAt: string
  uploadedBy: string
  status?: string
  blobUrl?: string
}

export interface SalesCallScore {
  global: number
  greeting?: number
  needDiscovery?: number
  objectionHandling?: number
  closingSkills?: number
  empathy?: number
  criteria?: Array<{ name: string; score: number; weight: number }>
}

export interface SalesCallAnalysis {
  summary: string
  strengths: string[]
  weaknesses: string[]
  nextSteps: string[]
  customerMood: string
  salesOutcome: string
  utel?: UtelAnalysis
  emotionalAnalysis?: EmotionalAnalysis
}

export interface SalesCall {
  id: string
  metadata: SalesCallMetadata
  score: SalesCallScore
  analysis: SalesCallAnalysis
  transcription: TranscriptionUtterance[]
  isFromDrive?: boolean
  isLocalCacheOnly?: boolean
  notasCount?: number
  objecionesCount?: number
}

export interface Nota {
  id: string
  auditoriaId: string
  supervisorEmail: string
  supervisorName: string
  segmentStart: number
  segmentEnd: number
  text: string
  createdAt: string
}

export type TipoObjecion = 'tono_inadecuado' | 'info_erronea' | 'proceso_omitido' | 'oportunidad_perdida' | 'otro'
export type Severidad = 'baja' | 'media' | 'alta' | 'critica'

export interface Objecion {
  id: string
  auditoriaId: string
  supervisorEmail: string
  supervisorName: string
  segmentStart: number
  segmentEnd: number
  tipoObjecion: TipoObjecion
  severidad: Severidad
  text: string
  createdAt: string
}
