import api from '@/api/client';
import type {
  Contact,
  Pipeline,
  PipelineStage,
} from '@/api/types';

const BASE = '/api/pipeline';

/**
 * Fetch the pipeline and its stages for the current user's scope.
 */
export async function getPipelineWithStages(): Promise<{ pipeline: Pipeline; stages: PipelineStage[] }> {
  const res = await api.get<{ pipeline: Pipeline; stages: PipelineStage[] }>(BASE);
  return res.data;
}

/**
 * Fetch all stages for the user's pipeline.
 */
export async function getStages(): Promise<PipelineStage[]> {
  const res = await api.get<PipelineStage[]>(`${BASE}/stages`);
  return res.data;
}

/**
 * Fetch contacts grouped by pipeline stage (Kanban view).
 */
export async function getKanbanContacts(): Promise<{ stageId: string; contacts: Contact[] }[]> {
  const res = await api.get<{ stageId: string; contacts: Contact[] }[]>(`${BASE}/contacts`);
  return res.data;
}

/**
 * Create a new stage. Pipeline ID is derived from the user's scope on the server.
 */
export async function createStage(data: {
  name: string;
  displayOrder: number;
  color: string;
  probability?: number;
}): Promise<PipelineStage> {
  const res = await api.post<PipelineStage>(`${BASE}/stages`, data);
  return res.data;
}

/**
 * Update an existing stage.
 */
export async function updateStage(
  id: string,
  data: Partial<PipelineStage>,
): Promise<PipelineStage> {
  const res = await api.patch<PipelineStage>(`${BASE}/stages/${id}`, data);
  return res.data;
}

/**
 * Delete a stage.
 */
export async function deleteStage(id: string): Promise<void> {
  await api.delete<never>(`${BASE}/stages/${id}`);
}
