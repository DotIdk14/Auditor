import api from '@/api/client';
import type {
  PaginatedResponse,
  Task,
  TaskCreate,
  TaskFilters,
  TaskUpdate,
} from '@/api/types';

const BASE = '/api/tasks';

export async function getTasks(
  filters: TaskFilters = {},
): Promise<PaginatedResponse<Task>> {
  const params: Record<string, string | number | undefined> = {};

  if (filters.contactId) params.contactId = filters.contactId;
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.dueDateBefore) params.dueDateBefore = filters.dueDateBefore;
  if (filters.dueDateAfter) params.dueDateAfter = filters.dueDateAfter;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;

  const res = await api.get<PaginatedResponse<Task>>(BASE, { params });
  return res.data;
}

export async function getTask(id: string): Promise<Task> {
  const res = await api.get<Task>(`${BASE}/${id}`);
  return res.data;
}

export async function createTask(data: TaskCreate): Promise<Task> {
  const res = await api.post<Task>(BASE, data);
  return res.data;
}

export async function updateTask(
  id: string,
  data: TaskUpdate,
): Promise<Task> {
  const res = await api.patch<Task>(`${BASE}/${id}`, data);
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete<never>(`${BASE}/${id}`);
}
