import { z } from "zod";

// ── Auth & RBAC ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'area_manager' | 'coordinator' | 'supervisor' | 'agent' | 'qa';

// Map from Visor Spanish roles to Auditor English roles
export const RoleVisorToAuditor: Record<string, UserRole> = {
  admin: 'admin',
  gerente: 'area_manager',
  coordinador: 'coordinator',
  supervisor: 'supervisor',
  agente: 'agent',
};

export const RoleAuditorToVisor: Record<string, string> = {
  admin: 'admin',
  area_manager: 'gerente',
  coordinator: 'coordinador',
  supervisor: 'supervisor',
  agent: 'agente',
  qa: 'auditor',
};

export const UserRoleSchema = z.enum(['admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa']);

export interface JWTPayload {
  sub: string;
  email: string;
  displayName: string;
  role: UserRole;
  areaId?: string | null;
  teamId?: string | null;
  iat?: number;
  exp?: number;
}

export interface MeResponse extends JWTPayload {
  hierarchy: {
    areaId: string | null;
    teamId: string | null;
    supervisorId?: string | null;
  };
  permissions: string[];
}

// ── Calls / Kanban ──────────────────────────────────────────────

export type CallStatus = 'por_auditar' | 'en_revision' | 'completada';
export type CallCategory = 'CALIDAD' | 'EXPERIENCIA' | 'CUMPLIMIENTO';
export type CallCategoryApi = 'venta' | 'soporte' | 'reclamo' | 'cobranza';

export const CallStatusSchema = z.enum(['por_auditar', 'en_revision', 'completada']);

export interface CallItem {
  id: string;
  clientId: string;
  title: string;
  rawTitle: string;
  shortName: string;
  agent: string;
  agentId?: string;
  category: CallCategory;
  status: CallStatus;
  score?: number | null;
  date?: string;
  avatar: string;
}

export interface CallFilters {
  status?: CallStatus;
  agentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Audio & Transcription ───────────────────────────────────────

export interface DialogueUtterance {
  speaker: 'Vendedor' | 'Cliente';
  time: string;
  seconds: number;
  sentiment: {
    type: 'normal' | 'objection' | 'positive';
    label: string;
  };
  text: string;
  confidence: number;
}

export interface RubricItem {
  title: string;
  points: number;
  maxPoints: number;
  status: 'success' | 'warning' | 'danger';
  details: string[];
}

// ── Audit Record ────────────────────────────────────────────────

export interface AuditRecord {
  callId: string;
  clientId: string;
  fileName: string;
  trackerId: string;
  score: number;
  agentName: string;
  date: string;
  category: CallCategory;
  description: string;
  durationSec: number;
  rubric: RubricItem[];
  transcript: DialogueUtterance[];
  summary: string;
  clientTemper: string;
  commercialOutcome: string;
  coachingType: string;
  justification: Record<string, string>;
  purchaseIntentPct: number;
  purchaseIntentLabel: string;
  clientSentimentScoreLabel: string;
  cognitivePath: string;
  transitionSummary: string;
  purchaseSignals: string[];
  objections: string[];
  coaching: {
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  };
  rating?: number;
}

export interface AuditFullResponse {
  call: CallItem;
  audit: AuditRecord;
  transcription: DialogueUtterance[];
  rubric: RubricItem[];
  coaching: AuditRecord['coaching'];
  insights: {
    summary: string;
    clientPerception: {
      temper: string;
      commercialOutcome: string;
      purchaseIntentPct: number;
      purchaseIntentLabel: string;
      sentimentLabel: string;
      cognitivePath: string;
      transitionSummary: string;
    };
    coaching: {
      type: string;
      justification: Record<string, string>;
    };
    purchaseSignals: string[];
    objections: string[];
  };
  annotations: Annotation[];
  audioUrl?: string;
}

export interface Annotation {
  id: string;
  utteranceIndex: number;
  author: string;
  role: string;
  category: string;
  text: string;
  createdAt: string;
}

export const AnnotationSchema = z.object({
  utteranceIndex: z.number().int().min(0),
  category: z.enum([
    'Buena Práctica', 'Error Proceso', 'Manejo Objeción', 'Empatía', 'Cierre',
    'Objeción', 'Señal Compra', 'Duda', 'Frustración', 'Satisfacción'
  ]),
  text: z.string().min(1).max(500),
});

// ── CRM Contacts ────────────────────────────────────────────────

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
export type ContactSource = 'inbound' | 'outbound' | 'referral' | 'web' | 'event' | 'other' | 'manual';
export type ContactDisposition = 'no_contactado' | 'cuelgue' | 'evaluando';

export type InteractionType = 'llamada' | 'correo' | 'whatsapp';
export type InteractionTipificacion = 'positiva' | 'negativa';

export interface InteractionFile {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  type: InteractionType;
  tipificacion: InteractionTipificacion;
  notes: string | null;
  files: InteractionFile[];
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export const ContactStatusSchema = z.enum(['lead', 'prospect', 'customer', 'churned']);
export const ContactDispositionSchema = z.enum(['no_contactado', 'cuelgue', 'evaluando']);

export interface Contact {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: ContactSource;
  status: ContactStatus;
  disposition: ContactDisposition;
  disposition_locked: boolean;
  assigned_to: string;
  assignedToName?: string;
  area_id: string | null;
  team_id: string | null;
  pipeline_id: string | null;
  stage_id: string | null;
  stageName?: string;
  metadata: Record<string, unknown>;
  last_activity_at: string | null;
  callback_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFilters {
  search?: string;
  status?: ContactStatus;
  source?: ContactSource;
  disposition?: ContactDisposition;
  assignedTo?: string;
  stageId?: string;
  areaId?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
}

// ── Pipeline ────────────────────────────────────────────────────

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  area_id: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  display_order: number;
  color: string;
  is_closed_won: boolean;
  is_closed_lost: boolean;
  probability: number;
  created_at: string;
  updated_at: string;
}

// ── Tasks ───────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'other';

export interface Task {
  id: string;
  contact_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  area_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Resources / Knowledge Base ──────────────────────────────────

export type ResourceType = 'image' | 'speech' | 'objection' | 'note';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  content: Record<string, unknown>;
  created_by: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

// ── Dashboard ───────────────────────────────────────────────────

export interface SalesKPIs {
  pipelineValue: number;
  conversionRate: number;
  totalLeads: number;
  totalCustomers: number;
  avgDealVelocityDays: number;
  contactsByStage: { stageId: string; count: number; value: number }[];
  activityByAgent: { agentId: string; agentName: string; callsCount: number; tasksCount: number; contactsCount: number }[];
}

export interface QAKPIs {
  averagePceScore: number;
  totalAudits: number;
  complianceRate: number;
  emotionalTrend: { positive: number; neutral: number; negative: number };
  auditsByAgent: { agentId: string; agentName: string; count: number; avgScore: number }[];
}

export interface UnifiedDashboard {
  sales: SalesKPIs;
  qa: QAKPIs;
}

// ── API response wrappers ───────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// ── User Profile (Visor legacy compatibility) ───────────────────

export interface VisorUser {
  username: string;
  name: string;
  nickname?: string;
  role: string;
  team: string;
  avatarUrl?: string;
  avatarChar: string;
  gerenteId?: string;
  coordinadorId?: string;
  supervisorId?: string;
  accentColor?: 'amber' | 'blue' | 'emerald';
  density?: 'compact' | 'relaxed';
}
