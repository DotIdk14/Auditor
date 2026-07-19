// ── Service scope (injected by auth middleware) ────────────────────
export interface ServiceScope {
  role: UserRole;
  areaId: string | null;
  teamId: string | null;
  userId: string;
}

// ── Existing types ─────────────────────────────────────────────────
export interface TranscriptionUtterance {
  speaker: 'Vendedor' | 'Cliente';
  start: number;
  end: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

// ── CRM Types ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'area_manager' | 'coordinator' | 'supervisor' | 'agent' | 'qa';

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

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  area_id: string | null;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  description: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  area_id: string;
  name: string;
  code: string;
  supervisor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
export type ContactSource = 'inbound' | 'outbound' | 'referral' | 'web' | 'event' | 'other' | 'manual';
export type ContactDisposition = 'no_contactado' | 'cuelgue' | 'evaluando';

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
  metadata: Record<string, unknown>;
  last_activity_at: string | null;
  callback_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  source?: ContactSource;
  status?: ContactStatus;
  disposition?: ContactDisposition;
  callbackAt?: string | null;
  pipelineId?: string;
  stageId?: string;
  metadata?: Record<string, unknown>;
}

export interface ContactUpdate {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  source?: ContactSource;
  status?: ContactStatus;
  disposition?: ContactDisposition;
  dispositionLocked?: boolean;
  callbackAt?: string | null;
  stageId?: string | null;
  metadata?: Record<string, unknown>;
}

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

export type PipelineStageProbability = number;

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  display_order: number;
  color: string;
  is_closed_won: boolean;
  is_closed_lost: boolean;
  probability: PipelineStageProbability;
  created_at: string;
  updated_at: string;
}

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

export interface TaskCreate {
  contactId: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate?: string;
  priority?: TaskPriority;
  type?: TaskType;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  assignedTo?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
}

// ── Dashboard types ───────────────────────────────────────────────
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

// ── API Response types ────────────────────────────────────────────
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

// ── Query filters ─────────────────────────────────────────────────
export interface ContactFilters {
  search?: string;
  status?: ContactStatus;
  source?: ContactSource;
  disposition?: ContactDisposition;
  tipo?: string;
  assignedTo?: string;
  stageId?: string;
  areaId?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
}

export interface TaskFilters {
  contactId?: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateBefore?: string;
  dueDateAfter?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesCall {
  id: string;
  contact_id: string | null;
  area_id: string | null;
  team_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  score: Record<string, unknown>;
  analysis: Record<string, unknown>;
  transcription: TranscriptionUtterance[];
}

export interface Nota {
  id: string;
  auditoriaId: string | null;
  supervisorEmail: string;
  supervisorName: string;
  segmentStart: number | null;
  segmentEnd: number | null;
  text: string;
  createdAt: string;
  type?: string;
  callName?: string | null;
}

export interface Objecion {
  id: string;
  auditoriaId: string;
  supervisorEmail: string;
  supervisorName: string;
  segmentStart: number;
  segmentEnd: number;
  tipoObjecion: string;
  severidad: string;
  text: string;
  createdAt: string;
}

export interface ContactRecord {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  source?: string;
  status?: string;
  disposition?: string;
  callbackAt?: string | null;
  pipelineId?: string;
  stageId?: string;
  metadata?: Record<string, unknown>;
  dispositionLocked?: boolean;
}
