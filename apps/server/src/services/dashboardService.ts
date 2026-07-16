import { insforge } from "./insforge.js";
import type { SalesKPIs, UnifiedDashboard } from "../types.js";
import type { ServiceScope } from "../types.js";

/**
 * Get sales KPIs for a given scope.
 */
export async function getSalesKPIs(scope: ServiceScope): Promise<SalesKPIs> {
  if (!process.env.INSFORGE_BASE_URL) {
    return {
      pipelineValue: 0,
      conversionRate: 0,
      totalLeads: 0,
      totalCustomers: 0,
      avgDealVelocityDays: 0,
      contactsByStage: [],
      activityByAgent: [],
    };
  }

  // Build base filter
  const buildFilter = (query: any) => {
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
      default:
        query = query.eq("assigned_to", scope.userId);
    }
    return query;
  };

  // Get contacts by stage
  let contactsQuery = insforge.database.from("contacts").select("id, stage_id, status, pipeline_id, created_at");
  contactsQuery = buildFilter(contactsQuery);
  const { data: contacts } = await contactsQuery;

  const totalLeads = contacts?.filter(c => c.status === "lead").length ?? 0;
  const totalCustomers = contacts?.filter(c => c.status === "customer").length ?? 0;
  const totalContacts = contacts?.length ?? 0;
  const conversionRate = totalContacts > 0 ? (totalCustomers / totalContacts) * 100 : 0;

  // Contacts by stage
  const stageCounts = new Map<string, number>();
  for (const c of contacts || []) {
    const sid = c.stage_id || "unassigned";
    stageCounts.set(sid, (stageCounts.get(sid) || 0) + 1);
  }

  const contactsByStage = Array.from(stageCounts.entries()).map(([stageId, count]) => ({
    stageId,
    count,
    value: 0, // Would need deal value from metadata
  }));

  // Activity by agent
  let agentsQuery = insforge.database.from("contacts")
    .select("assigned_to")
    .eq("assigned_to", scope.userId);
  
  if (["admin", "area_manager", "coordinator", "supervisor"].includes(scope.role)) {
    agentsQuery = insforge.database.from("contacts").select("assigned_to");
    agentsQuery = buildFilter(agentsQuery);
  }
  
  const { data: agentData } = await agentsQuery;
  const agentIds = [...new Set((agentData || []).map(a => a.assigned_to))];

  const activityByAgent = await Promise.all(
    agentIds.map(async (agentId) => {
      const [callsRes, tasksRes, contactsRes] = await Promise.all([
        insforge.database.from("auditorias").select("id", { count: "exact", head: true }).eq("contact_id", agentId),
        insforge.database.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", agentId),
        insforge.database.from("contacts").select("id", { count: "exact", head: true }).eq("assigned_to", agentId),
      ]);

      const profile = await insforge.database
        .from("profiles")
        .select("full_name")
        .eq("id", agentId)
        .single();

      return {
        agentId,
        agentName: profile.data?.full_name || agentId,
        callsCount: callsRes.count || 0,
        tasksCount: tasksRes.count || 0,
        contactsCount: contactsRes.count || 0,
      };
    })
  );

  return {
    pipelineValue: 0, // Would sum estimated deal value from metadata
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalLeads,
    totalCustomers,
    avgDealVelocityDays: 0, // Would compute from stage change timestamps
    contactsByStage,
    activityByAgent,
  };
}

/**
 * Get QA KPIs for a given scope.
 */
export async function getQAKPIs(scope: ServiceScope): Promise<{
  averagePceScore: number;
  totalAudits: number;
  complianceRate: number;
  emotionalTrend: { positive: number; neutral: number; negative: number };
  auditsByAgent: { agentId: string; agentName: string; count: number; avgScore: number }[];
}> {
  if (!process.env.INSFORGE_BASE_URL) return { averagePceScore: 0, totalAudits: 0, complianceRate: 0, emotionalTrend: { positive: 0, neutral: 0, negative: 0 }, auditsByAgent: [] };

  let query = insforge.database.from("auditorias").select("id, score, metadata");
  
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
    case "qa":
      query = query.eq("area_id", scope.areaId);
      break;
    case "agent": {
      const { data: agentContactIds } = await insforge.database
        .from("contacts")
        .select("id")
        .eq("assigned_to", scope.userId);
      const agentContactIdList = (agentContactIds || []).map(c => c.id);
      if (agentContactIdList.length > 0) {
        query = query.in("contact_id", agentContactIdList);
      } else {
        query = query.eq("contact_id", "none"); // Return empty
      }
      break;
    }
  }

  const { data: audits } = await query;

  if (!audits || audits.length === 0) {
    return { averagePceScore: 0, totalAudits: 0, complianceRate: 0, emotionalTrend: { positive: 0, neutral: 0, negative: 0 }, auditsByAgent: [] };
  }

  const totalScore = audits.reduce((sum, a) => sum + (a.score?.total ?? 0), 0);
  const averagePceScore = audits.length > 0 ? totalScore / audits.length : 0;
  const complianceRate = audits.filter(a => (a.score?.total ?? 0) >= 70).length / audits.length * 100;
  
  // Emotional trend from analysis
  const emotionalTrend = { positive: 0, neutral: 0, negative: 0 };
  for (const a of audits) {
    const sentiment = a.metadata?.sentiment || "neutral";
    if (sentiment === "positive") emotionalTrend.positive++;
    else if (sentiment === "negative") emotionalTrend.negative++;
    else emotionalTrend.neutral++;
  }

  // Audits by agent (via contact)
  const agentScores = new Map<string, { count: number; totalScore: number; name: string }>();
  for (const a of audits) {
    if (a.metadata?.agentId) {
      const entry = agentScores.get(a.metadata.agentId) || { count: 0, totalScore: 0, name: a.metadata.agentName || a.metadata.agentId };
      entry.count++;
      entry.totalScore += a.score?.total ?? 0;
      agentScores.set(a.metadata.agentId, entry);
    }
  }

  const auditsByAgent = Array.from(agentScores.entries()).map(([agentId, data]) => ({
    agentId,
    agentName: data.name,
    count: data.count,
    avgScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0,
  }));

  return {
    averagePceScore: Math.round(averagePceScore * 100) / 100,
    totalAudits: audits.length,
    complianceRate: Math.round(complianceRate * 100) / 100,
    emotionalTrend,
    auditsByAgent,
  };
}

/**
 * Get unified dashboard (sales + QA) for supervisors.
 */
export async function getUnifiedDashboard(scope: ServiceScope): Promise<UnifiedDashboard> {
  const [sales, qa] = await Promise.all([
    getSalesKPIs(scope),
    getQAKPIs(scope),
  ]);

  return { sales, qa };
}
