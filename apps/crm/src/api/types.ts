// ─── User & Auth ────────────────────────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'area_manager'
  | 'coordinator'
  | 'supervisor'
  | 'agent'
  | 'qa';

export interface JWTPayload {
  sub: string;
  email: string;
  displayName: string;
  role: UserRole;
  areaId?: string | null;
  teamId?: string | null;
}

// ─── Contacts ───────────────────────────────────────────────────────────────
export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
export type ContactSource =
  | 'inbound'
  | 'outbound'
  | 'referral'
  | 'web'
  | 'event'
  | 'other'
  | 'manual';
export type ContactDisposition = 'no_contactado' | 'cuelgue' | 'evaluando';

export interface Contact {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: ContactSource;
  status: ContactStatus;
  disposition: ContactDisposition;
  assignedTo: string;
  areaId: string | null;
  teamId: string | null;
  pipelineId: string | null;
  stageId: string | null;
  metadata: Record<string, unknown>;
  lastActivityAt: string | null;
  callbackAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Joined field from API */
  assignedToName?: string;
  /** Joined field from API */
  stageName?: string;
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
  callbackAt?: string | null;
  stageId?: string | null;
  metadata?: Record<string, unknown>;
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

// ─── Pipeline ───────────────────────────────────────────────────────────────
export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  areaId: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  displayOrder: number;
  color: string;
  isClosedWon: boolean;
  isClosedLost: boolean;
  probability: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'follow_up'
  | 'demo'
  | 'proposal'
  | 'other';

export interface Task {
  id: string;
  contactId: string;
  title: string;
  description: string | null;
  assignedTo: string;
  createdBy: string;
  dueDate: string | null;
  completedAt: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  areaId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Joined field from API */
  contactName?: string;
  /** Joined field from API */
  assignedToName?: string;
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

// ─── Dashboard ──────────────────────────────────────────────────────────────
export interface SalesKPIs {
  pipelineValue: number;
  conversionRate: number;
  totalLeads: number;
  totalCustomers: number;
  avgDealVelocityDays: number;
  contactsByStage: { stageId: string; count: number; value: number }[];
  activityByAgent: {
    agentId: string;
    agentName: string;
    callsCount: number;
    tasksCount: number;
    contactsCount: number;
  }[];
}

export interface QAKPIs {
  averagePceScore: number;
  totalAudits: number;
  complianceRate: number;
  emotionalTrend: { positive: number; neutral: number; negative: number };
  auditsByAgent: {
    agentId: string;
    agentName: string;
    count: number;
    avgScore: number;
  }[];
}

export interface UnifiedDashboard {
  sales: SalesKPIs;
  qa: QAKPIs;
}

// ─── Shared / Lookup ────────────────────────────────────────────────────────
export interface Area {
  id: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
  isActive: boolean;
}

export interface Team {
  id: string;
  areaId: string;
  name: string;
  code: string;
  supervisorId: string | null;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  areaId: string | null;
  teamId: string | null;
  isActive: boolean;
}

// ─── Generic paginated response ─────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
