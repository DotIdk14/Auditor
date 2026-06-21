/**
 * Tests for the unified contact activity endpoint.
 * Validates: audit+tasks merge, ordering, type discrimination.
 */
import { describe, it, expect } from "vitest";

// ── Activity item type ─────────────────────────────────────────────
interface AuditItem {
  id: string;
  type: "audit";
  title: string;
  description: string;
  created_at: string;
  score: number | null;
  status: string;
  callId: string;
}

interface TaskItem {
  id: string;
  type: "task";
  title: string;
  taskType: string;
  description: string;
  created_at: string;
  due_date: string | null;
  completed_at: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
}

type ActivityItem = AuditItem | TaskItem;

// ── Mapper functions (mirrors the route logic) ─────────────────────
function mapAuditToActivity(audit: any): AuditItem {
  const scoreRaw = audit.score;
  const score = scoreRaw != null
    ? (typeof scoreRaw === "object" ? scoreRaw?.global ?? null : scoreRaw)
    : null;
  return {
    id: audit.id,
    type: "audit",
    title: audit.metadata?.fileName || "Auditoría",
    description: audit.metadata?.agentName ? `Agente: ${audit.metadata.agentName}` : "",
    created_at: audit.created_at,
    score,
    status: audit.status || audit.metadata?.status || "completada",
    callId: audit.id,
  };
}

function mapTaskToActivity(task: any): TaskItem {
  return {
    id: task.id,
    type: "task",
    title: task.title,
    taskType: task.type || "follow_up",
    description: task.description || "",
    created_at: task.created_at,
    due_date: task.due_date || null,
    completed_at: task.completed_at || null,
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || null,
  };
}

function unifyActivity(audits: any[], tasks: any[]): ActivityItem[] {
  const auditItems = audits.map(mapAuditToActivity);
  const taskItems = tasks.map(mapTaskToActivity);
  return [...auditItems, ...taskItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ── Tests ──────────────────────────────────────────────────────────
describe("contact activity mapper", () => {
  it("mapea una auditoría correctamente", () => {
    const audit = {
      id: "audit-001",
      metadata: { fileName: "llamada-ventas.mp3", agentName: "Carlos Agente" },
      score: { global: 8.5 },
      status: "completada",
      created_at: "2025-06-01T10:00:00Z",
    };

    const result = mapAuditToActivity(audit);
    expect(result.id).toBe("audit-001");
    expect(result.type).toBe("audit");
    expect(result.title).toBe("llamada-ventas.mp3");
    expect(result.description).toBe("Agente: Carlos Agente");
    expect(result.score).toBe(8.5);
    expect(result.status).toBe("completada");
    expect(result.callId).toBe("audit-001");
  });

  it("mapea auditoría sin agente", () => {
    const audit = {
      id: "audit-002",
      metadata: { fileName: "test.wav" },
      score: null,
      created_at: "2025-05-01T10:00:00Z",
    };

    const result = mapAuditToActivity(audit);
    expect(result.description).toBe("");
    expect(result.score).toBeNull();
    expect(result.status).toBe("completada"); // default
  });

  it("maneja score numérico directo", () => {
    const audit = {
      id: "audit-003",
      metadata: {},
      score: 75,
      created_at: "2025-04-01T10:00:00Z",
    };

    const result = mapAuditToActivity(audit);
    expect(result.score).toBe(75);
  });

  it("mapea una tarea correctamente", () => {
    const task = {
      id: "task-001",
      title: "Llamar al cliente",
      type: "call",
      description: "Seguimiento post-venta",
      created_at: "2025-06-15T14:00:00Z",
      due_date: "2025-06-16T14:00:00Z",
      completed_at: null,
      status: "pending",
      priority: "high",
      assigned_to: "agent-001",
    };

    const result = mapTaskToActivity(task);
    expect(result.id).toBe("task-001");
    expect(result.type).toBe("task");
    expect(result.title).toBe("Llamar al cliente");
    expect(result.taskType).toBe("call");
    expect(result.description).toBe("Seguimiento post-venta");
    expect(result.status).toBe("pending");
    expect(result.priority).toBe("high");
    expect(result.assigned_to).toBe("agent-001");
  });

  it("usa valor por defecto para taskType faltante", () => {
    const task = {
      id: "task-002",
      title: "Email de bienvenida",
      description: "",
      created_at: "2025-06-01T09:00:00Z",
      status: "completed",
      priority: "medium",
    };

    const result = mapTaskToActivity(task);
    expect(result.taskType).toBe("follow_up"); // default
  });
});

describe("contact activity unification", () => {
  it("ordena por fecha descendente (más reciente primero)", () => {
    const audits = [
      {
        id: "a1", metadata: {}, score: 8,
        created_at: "2025-05-01T10:00:00Z",
      },
    ];
    const tasks = [
      {
        id: "t1", title: "Tarea", type: "call", description: "",
        created_at: "2025-06-01T10:00:00Z", status: "pending", priority: "medium",
      },
      {
        id: "t2", title: "Tarea 2", type: "email", description: "",
        created_at: "2025-04-01T10:00:00Z", status: "completed", priority: "low",
      },
    ];

    const result = unifyActivity(audits, tasks);
    expect(result).toHaveLength(3);
    // La más reciente primero
    expect(result[0].id).toBe("t1"); // June 2025
    expect(result[1].id).toBe("a1"); // May 2025
    expect(result[2].id).toBe("t2"); // April 2025
  });

  it("devuelve array vacío sin datos", () => {
    const result = unifyActivity([], []);
    expect(result).toHaveLength(0);
  });

  it("identifica correctamente cada tipo de ítem", () => {
    const audits = [
      { id: "a1", metadata: {}, score: 9, created_at: "2025-01-01T00:00:00Z" },
    ];
    const tasks = [
      { id: "t1", title: "Call", type: "call", description: "",
        created_at: "2025-02-01T00:00:00Z", status: "pending", priority: "high" },
    ];

    const result = unifyActivity(audits, tasks);
    expect(result[0].type).toBe("task");
    expect(result[1].type).toBe("audit");
  });

  it("maneja fechas inválidas gracefulmente", () => {
    const audits = [
      { id: "a1", metadata: {}, score: null,
        created_at: "invalid-date" },
    ];
    const tasks = [
      { id: "t1", title: "T", type: "call", description: "",
        created_at: null, status: "pending", priority: "medium" },
    ];

    const result = unifyActivity(audits, tasks);
    expect(result).toHaveLength(2);
    // No debería lanzar excepción, el sort tolera NaN
  });
});

describe("contact activity integration scenarios", () => {
  it("actividad completa: auditorías + tareas de llamada + reuniones", () => {
    const audits = [
      {
        id: "call-001", metadata: {
          fileName: "venta_enero.mp3", agentName: "Sofía",
          status: "completada",
        },
        score: { global: 9.2 }, created_at: "2025-06-20T08:00:00Z",
      },
    ];

    const tasks = [
      {
        id: "task-call", title: "Llamada de seguimiento", type: "call",
        description: "Confirmar interés en plan premium",
        created_at: "2025-06-21T10:00:00Z", status: "pending", priority: "high",
        assigned_to: "agent-007",
      },
      {
        id: "task-meeting", title: "Demo del producto", type: "meeting",
        description: "Videollamada con el equipo de ventas",
        created_at: "2025-06-19T15:00:00Z", status: "completed", priority: "medium",
        assigned_to: "agent-008",
      },
      {
        id: "task-email", title: "Enviar propuesta comercial", type: "email",
        description: "",
        created_at: "2025-06-18T09:00:00Z", status: "in_progress", priority: "urgent",
        assigned_to: "agent-007",
      },
    ];

    const result = unifyActivity(audits, tasks);

    expect(result).toHaveLength(4);

    // Ordenado por fecha descendente
    expect(result[0].id).toBe("task-call"); // June 21
    expect(result[1].id).toBe("call-001");  // June 20
    expect(result[2].id).toBe("task-meeting"); // June 19
    expect(result[3].id).toBe("task-email");   // June 18

    // Verificar tipos
    const auditCount = result.filter(item => item.type === "audit").length;
    const taskCount = result.filter(item => item.type === "task").length;
    expect(auditCount).toBe(1);
    expect(taskCount).toBe(3);

    // Verificar que todas las tareas tienen prioridad
    const taskItems = result.filter(item => item.type === "task") as TaskItem[];
    taskItems.forEach(task => {
      expect(["low", "medium", "high", "urgent"]).toContain(task.priority);
    });
  });
});
