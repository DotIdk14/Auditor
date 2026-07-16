import { insforge } from "./insforge.js";
import type { Pipeline, PipelineStage, Contact } from "../types.js";
import type { ServiceScope } from "../types.js";

const PIPELINES_TABLE = "pipelines";
const STAGES_TABLE = "pipeline_stages";

function mapPipeline(row: any): Pipeline {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    area_id: row.area_id,
    is_default: row.is_default,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapStage(row: any): PipelineStage {
  return {
    id: row.id,
    pipeline_id: row.pipeline_id,
    name: row.name,
    display_order: row.display_order,
    color: row.color,
    is_closed_won: row.is_closed_won,
    is_closed_lost: row.is_closed_lost,
    probability: row.probability,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Get the pipeline for a given scope.
 * Returns the area-specific pipeline if it exists, otherwise the default global pipeline.
 */
export async function getPipelineForScope(scope: ServiceScope): Promise<Pipeline | null> {
  if (!insforge.database) throw new Error("Base de datos no disponible");

  // Try area-specific pipeline first
  if (scope.areaId && scope.role !== "admin") {
    const { data: areaPipeline } = await insforge.database
      .from(PIPELINES_TABLE)
      .select("*")
      .eq("area_id", scope.areaId)
      .eq("is_active", true)
      .maybeSingle();

    if (areaPipeline) return mapPipeline(areaPipeline);
  }

  // Fallback to default global pipeline
  const query = insforge.database
    .from(PIPELINES_TABLE)
    .select("*")
    .eq("is_active", true);
  const { data, error } = await query
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener pipeline: ${error.message}`);
  return data ? mapPipeline(data) : null;
}

/**
 * Get all stages for a pipeline, ordered by display_order.
 */
export async function getStages(pipelineId: string): Promise<PipelineStage[]> {
  const { data, error } = await insforge.database
    .from(STAGES_TABLE)
    .select("*")
    .eq("pipeline_id", pipelineId)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Error al obtener etapas: ${error.message}`);
  return (data || []).map(mapStage);
}

/**
 * Get all stages for a user's scope (pipeline).
 */
export async function getPipelineWithStages(scope: ServiceScope): Promise<{
  pipeline: Pipeline | null;
  stages: PipelineStage[];
}> {
  const pipeline = await getPipelineForScope(scope);
  if (!pipeline) return { pipeline: null, stages: [] };

  const stages = await getStages(pipeline.id);
  return { pipeline, stages };
}

/**
 * Create a new stage in a pipeline.
 */
export async function createStage(
  pipelineId: string,
  input: {
    name: string;
    displayOrder?: number;
    color?: string;
    isClosedWon?: boolean;
    isClosedLost?: boolean;
    probability?: number;
  }
): Promise<PipelineStage> {
  // Get max display_order if not specified
  let displayOrder = input.displayOrder;
  if (displayOrder === undefined) {
    const { data: maxStage } = await insforge.database
      .from(STAGES_TABLE)
      .select("display_order")
      .eq("pipeline_id", pipelineId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    displayOrder = (maxStage?.display_order ?? -1) + 1;
  }

  const { data, error } = await insforge.database
    .from(STAGES_TABLE)
    .insert({
      pipeline_id: pipelineId,
      name: input.name,
      display_order: displayOrder,
      color: input.color || "#6366f1",
      is_closed_won: input.isClosedWon || false,
      is_closed_lost: input.isClosedLost || false,
      probability: input.probability ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear etapa: ${error.message}`);
  return mapStage(data);
}

/**
 * Update a pipeline stage.
 */
export async function updateStage(
  stageId: string,
  input: Partial<{
    name: string;
    displayOrder: number;
    color: string;
    isClosedWon: boolean;
    isClosedLost: boolean;
    probability: number;
  }>
): Promise<PipelineStage | null> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.displayOrder !== undefined) updates.display_order = input.displayOrder;
  if (input.color !== undefined) updates.color = input.color;
  if (input.isClosedWon !== undefined) updates.is_closed_won = input.isClosedWon;
  if (input.isClosedLost !== undefined) updates.is_closed_lost = input.isClosedLost;
  if (input.probability !== undefined) updates.probability = input.probability;

  const { data, error } = await insforge.database
    .from(STAGES_TABLE)
    .update(updates)
    .eq("id", stageId)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar etapa: ${error.message}`);
  return data ? mapStage(data) : null;
}

/**
 * Delete a pipeline stage.
 */
export async function deleteStage(stageId: string): Promise<boolean> {
  // Unlink contacts from this stage first
  await insforge.database
    .from("contacts")
    .update({ stage_id: null })
    .eq("stage_id", stageId);

  const { error } = await insforge.database
    .from(STAGES_TABLE)
    .delete()
    .eq("id", stageId);

  if (error) throw new Error(`Error al eliminar etapa: ${error.message}`);
  return true;
}

/**
 * Get contacts grouped by stage for the Kanban view.
 */
export async function getContactsByStage(
  scope: ServiceScope
): Promise<{ stageId: string; contacts: Contact[] }[]> {
  const { pipeline, stages } = await getPipelineWithStages(scope);
  if (!pipeline || stages.length === 0) return [];

  // Get all contacts for this scope
  let query = insforge.database
    .from("contacts")
    .select("*")
    .in("pipeline_id", [pipeline.id, null]);

  // Apply scope
  switch (scope.role) {
    case "admin":
      break;
    case "area_manager":
    case "coordinator":
      query = query.eq("area_id", scope.areaId);
      break;
    case "supervisor":
      query = query.eq("team_id", scope.teamId);
      break;
    case "agent":
      query = query.eq("assigned_to", scope.userId);
      break;
    case "qa":
      query = query.eq("area_id", scope.areaId);
      break;
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error al obtener contactos: ${error.message}`);

  // Group by stage
  const grouped = new Map<string, Contact[]>();
  for (const stage of stages) {
    grouped.set(stage.id, []);
  }

  for (const row of data || []) {
    const contact: Contact = {
      id: row.id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      company: row.company,
      source: row.source,
      status: row.status,
      disposition: row.disposition || "no_contactado",
      disposition_locked: row.disposition_locked || false,
      assigned_to: row.assigned_to,
      area_id: row.area_id,
      team_id: row.team_id,
      pipeline_id: row.pipeline_id,
      stage_id: row.stage_id,
      metadata: row.metadata || {},
      last_activity_at: row.last_activity_at,
      callback_at: row.callback_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const stageId = row.stage_id || stages[0]?.id;
    if (stageId && grouped.has(stageId)) {
      grouped.get(stageId)!.push(contact);
    }
  }

  return stages.map((stage) => ({
    stageId: stage.id,
    contacts: grouped.get(stage.id) || [],
  }));
}
