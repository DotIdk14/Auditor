/**
 * Demo Seeder — Genera datos de prueba en memoria para el modo demo.
 * Se activa automáticamente cuando no hay conexión a Supabase.
 * Todos los datos son 100% locales y no persisten en DB.
 */

import type { UserRole } from "../types.js";

// ── Demo Users ────────────────────────────────────────────────────

export interface DemoUser {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  areaId: string | null;
  teamId: string | null;
}

export const DEMO_USERS: DemoUser[] = [
  {
    email: "admin@visor.com",
    password: "123",
    displayName: "Admin",
    role: "admin",
    areaId: "area-demo-001",
    teamId: null,
  },
  {
    email: "sofia@visor.com",
    password: "123",
    displayName: "Sofía (Gerente Ventas)",
    role: "area_manager",
    areaId: "area-demo-001",
    teamId: null,
  },
  {
    email: "marcos@visor.com",
    password: "123",
    displayName: "Marcos (Gerente Soporte)",
    role: "area_manager",
    areaId: "area-demo-001",
    teamId: null,
  },
  {
    email: "zakir@visor.com",
    password: "123",
    displayName: "Zakir (Coordinador)",
    role: "coordinator",
    areaId: "area-demo-001",
    teamId: "team-demo-001",
  },
  {
    email: "bagas@visor.com",
    password: "123",
    displayName: "Bagas (Supervisor)",
    role: "supervisor",
    areaId: "area-demo-001",
    teamId: "team-demo-001",
  },
  {
    email: "leonardo@visor.com",
    password: "123",
    displayName: "Leonardo (Agente)",
    role: "agent",
    areaId: "area-demo-001",
    teamId: "team-demo-001",
  },
];

export function findDemoUser(email: string, password: string): DemoUser | null {
  return DEMO_USERS.find(u => u.email === email && u.password === password) || null;
}

export function findDemoUserByEmail(email: string): DemoUser | null {
  return DEMO_USERS.find(u => u.email === email) || null;
}

// ── Demo Calls (Kanban) ──────────────────────────────────────────

export interface DemoCall {
  id: string;
  clientId: string;
  title: string;
  rawTitle: string;
  shortName: string;
  agent: string;
  agentId: string;
  category: string;
  status: string;
  score: number | null;
  date: string;
  avatar: string;
}

const STATUSES = ["por_auditar", "en_revision", "completada"] as const;
const CATEGORIES = ["CALIDAD", "EXPERIENCIA", "CUMPLIMIENTO"] as const;

const DEMO_AGENTS = [
  { name: "Leonardo Sámsul", id: "agent-leo" },
  { name: "Bayu Salto", id: "agent-bayu" },
  { name: "Padhang Sattrio", id: "agent-padhang" },
  { name: "Sir Dandy", id: "agent-sir" },
  { name: "Jhon Tosan", id: "agent-jhon" },
  { name: "Bagas Mahpie", id: "agent-bagas" },
];

export function generateDemoCalls(): DemoCall[] {
  const calls: DemoCall[] = [];

  for (let i = 0; i < 24; i++) {
    const agent = DEMO_AGENTS[i % DEMO_AGENTS.length];
    const statusIdx = i < 8 ? 0 : i < 16 ? 1 : 2;
    const status = STATUSES[statusIdx];
    const category = CATEGORIES[i % CATEGORIES.length];

    const titles = [
      `Llamada #${1100 + i} — Cliente premium`,
      `Llamada #${1100 + i} — Renovación plan`,
      `Llamada #${1100 + i} — Cobranza`,
      `Llamada #${1100 + i} — Soporte técnico`,
      `Llamada #${1100 + i} — Reclamo cliente`,
      `Llamada #${1100 + i} — Venta cruzada`,
      `Llamada #${1100 + i} — Verificación KYC`,
      `Llamada #${1100 + i} — Seguimiento lead`,
    ];

    const score = status === "completada" ? Math.round((60 + Math.random() * 35) * 10) / 10 : null;

    calls.push({
      id: `demo-call-${100 + i}`,
      clientId: `demo-client-${i}`,
      title: titles[i % titles.length],
      rawTitle: `audio_${100 + i}.mp3`,
      shortName: agent.name,
      agent: agent.name,
      agentId: agent.id,
      category,
      status,
      score,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      avatar: agent.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    });
  }

  return calls;
}

// ── Demo Contacts ─────────────────────────────────────────────────

export interface DemoContact {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  assigned_to: string;
  assignedToName?: string;
  area_id: string | null;
  team_id: string | null;
  stageName?: string;
  metadata: Record<string, unknown>;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export function generateDemoContacts(): DemoContact[] {
  const now = new Date();
  return [
    {
      id: "demo-contact-001", full_name: "Empresa TechSolutions SA", phone: "+52 55 1234 5678",
      email: "contacto@techsolutions.com", company: "TechSolutions SA", source: "inbound",
      status: "customer", assigned_to: "agent-leo", assignedToName: "Leonardo Sámsul",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Cerrado Ganado",
      metadata: {}, last_activity_at: now.toISOString(), created_at: new Date(now.getTime() - 30*86400000).toISOString(), updated_at: now.toISOString(),
    },
    {
      id: "demo-contact-002", full_name: "María Fernanda López", phone: "+52 55 9876 5432",
      email: "maria.lopez@email.com", company: null, source: "web",
      status: "lead", assigned_to: "agent-bayu", assignedToName: "Bayu Salto",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Nuevo",
      metadata: {}, last_activity_at: now.toISOString(), created_at: new Date(now.getTime() - 2*86400000).toISOString(), updated_at: now.toISOString(),
    },
    {
      id: "demo-contact-003", full_name: "Distribuidora del Norte", phone: "+52 81 2345 6789",
      email: "info@distribuidoranorte.com", company: "Distribuidora del Norte", source: "referral",
      status: "prospect", assigned_to: "agent-padhang", assignedToName: "Padhang Sattrio",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Calificado",
      metadata: {}, last_activity_at: now.toISOString(), created_at: new Date(now.getTime() - 15*86400000).toISOString(), updated_at: now.toISOString(),
    },
    {
      id: "demo-contact-004", full_name: "Juan Carlos Mendoza", phone: "+52 55 8765 4321",
      email: "jcmendoza@outlook.com", company: null, source: "outbound",
      status: "lead", assigned_to: "agent-sir", assignedToName: "Sir Dandy",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Contactado",
      metadata: {}, last_activity_at: null, created_at: new Date(now.getTime() - 5*86400000).toISOString(), updated_at: now.toISOString(),
    },
    {
      id: "demo-contact-005", full_name: "Servicios Corporativos GP", phone: "+52 55 3456 7890",
      email: "ventas@gp-corp.com", company: "Servicios Corporativos GP", source: "event",
      status: "customer", assigned_to: "agent-jhon", assignedToName: "Jhon Tosan",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Cerrado Ganado",
      metadata: {}, last_activity_at: now.toISOString(), created_at: new Date(now.getTime() - 60*86400000).toISOString(), updated_at: now.toISOString(),
    },
    {
      id: "demo-contact-006", full_name: "Inversiones del Valle", phone: "+52 33 1234 5678",
      email: "contacto@inversionesvalle.com", company: "Inversiones del Valle", source: "inbound",
      status: "churned", assigned_to: "agent-bagas", assignedToName: "Bagas Mahpie",
      area_id: "area-demo-001", team_id: "team-demo-001", stageName: "Cerrado Perdido",
      metadata: {}, last_activity_at: new Date(now.getTime() - 90*86400000).toISOString(), created_at: new Date(now.getTime() - 180*86400000).toISOString(), updated_at: now.toISOString(),
    },
  ];
}

// ── Demo Dashboard KPIs ──────────────────────────────────────────

export function generateDemoKPIs() {
  return {
    sales: {
      pipelineValue: 2840000,
      conversionRate: 32.5,
      totalLeads: 48,
      totalCustomers: 22,
      avgDealVelocityDays: 18,
      contactsByStage: [
        { stageId: "nuevo", count: 15, value: 450000 },
        { stageId: "contactado", count: 12, value: 520000 },
        { stageId: "calificado", count: 8, value: 680000 },
        { stageId: "propuesta", count: 6, value: 720000 },
        { stageId: "negociacion", count: 4, value: 470000 },
      ],
      activityByAgent: [
        { agentId: "agent-leo", agentName: "Leonardo Sámsul", callsCount: 34, tasksCount: 12, contactsCount: 8 },
        { agentId: "agent-bayu", agentName: "Bayu Salto", callsCount: 28, tasksCount: 9, contactsCount: 6 },
        { agentId: "agent-padhang", agentName: "Padhang Sattrio", callsCount: 31, tasksCount: 14, contactsCount: 10 },
        { agentId: "agent-sir", agentName: "Sir Dandy", callsCount: 22, tasksCount: 7, contactsCount: 5 },
        { agentId: "agent-jhon", agentName: "Jhon Tosan", callsCount: 19, tasksCount: 5, contactsCount: 4 },
        { agentId: "agent-bagas", agentName: "Bagas Mahpie", callsCount: 26, tasksCount: 10, contactsCount: 7 },
      ],
    },
    qa: {
      averagePceScore: 76.4,
      totalAudits: 156,
      complianceRate: 82.1,
      emotionalTrend: { positive: 68, neutral: 52, negative: 36 },
      auditsByAgent: [
        { agentId: "agent-leo", agentName: "Leonardo Sámsul", count: 28, avgScore: 81.2 },
        { agentId: "agent-bayu", agentName: "Bayu Salto", count: 24, avgScore: 74.8 },
        { agentId: "agent-padhang", agentName: "Padhang Sattrio", count: 31, avgScore: 79.5 },
        { agentId: "agent-sir", agentName: "Sir Dandy", count: 19, avgScore: 68.3 },
        { agentId: "agent-jhon", agentName: "Jhon Tosan", count: 15, avgScore: 72.0 },
        { agentId: "agent-bagas", agentName: "Bagas Mahpie", count: 22, avgScore: 77.6 },
      ],
    },
  };
}

// ── Demo Notes ────────────────────────────────────────────────────

export function generateDemoNotes() {
  return {
    "demo-call-100": [
      { id: "note-1", auditoriaId: "demo-call-100", supervisorEmail: "bagas@visor.com",
        supervisorName: "Bagas (Supervisor)", segmentStart: 0, segmentEnd: 0,
        text: "El agente mantuvo un tono profesional durante toda la llamada. Buen manejo de objeciones.",
        createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "note-2", auditoriaId: "demo-call-100", supervisorEmail: "bagas@visor.com",
        supervisorName: "Bagas (Supervisor)", segmentStart: 0, segmentEnd: 0,
        text: "Revisar el uso del saludo formal al inicio. Omitió presentarse con nombre completo.",
        createdAt: new Date(Date.now() - 43200000).toISOString() },
    ],
    "demo-call-101": [
      { id: "note-3", auditoriaId: "demo-call-101", supervisorEmail: "bagas@visor.com",
        supervisorName: "Bagas (Supervisor)", segmentStart: 0, segmentEnd: 0,
        text: "Excelente cierre de venta. Logró identificar la necesidad del cliente y ofrecer la solución adecuada.",
        createdAt: new Date(Date.now() - 172800000).toISOString() },
    ],
    "demo-call-105": [
      { id: "note-4", auditoriaId: "demo-call-105", supervisorEmail: "bagas@visor.com",
        supervisorName: "Bagas (Supervisor)", segmentStart: 0, segmentEnd: 0,
        text: "Cliente frustrado - el agente mantuvo la calma y resolvió el reclamo satisfactoriamente.",
        createdAt: new Date(Date.now() - 259200000).toISOString() },
    ],
  };
}

// ── Full Audit Data (for AuditorPage) ─────────────────────────────

export function generateDemoAuditFull(callId: string): any {
  // Find the matching demo call
  const allCalls = generateDemoCalls();
  const callData = allCalls.find(c => c.id === callId);
  if (!callData) return null;

  const score = callData.score || Math.round((60 + Math.random() * 35) * 10) / 10;
  const transcript = [
    { speaker: "Vendedor", time: "00:05", seconds: 5, sentiment: { type: "normal", label: "Saludo" }, text: "Buenos días, soy Leonardo Sámsul de UTEL. ¿Me comunico con el Sr. Mendoza?", confidence: 95 },
    { speaker: "Cliente", time: "00:12", seconds: 12, sentiment: { type: "normal", label: "Receptivo" }, text: "Sí, dígame, ¿en qué puedo ayudarlo?", confidence: 92 },
    { speaker: "Vendedor", time: "00:18", seconds: 18, sentiment: { type: "normal", label: "Presentación" }, text: "El motivo de mi llamada es comentarle sobre nuestra nueva plataforma de servicios digitales que estamos lanzando este mes.", confidence: 96 },
    { speaker: "Cliente", time: "00:28", seconds: 28, sentiment: { type: "objection", label: "Duda" }, text: "Mire, la verdad estoy contento con mi proveedor actual. No sé si necesito cambiar.", confidence: 88 },
    { speaker: "Vendedor", time: "00:35", seconds: 35, sentiment: { type: "normal", label: "Manejo objeción" }, text: "Entiendo perfectamente. Precisamente por eso le llamo, porque muchos clientes como usted nos han comentado que buscan mejores herramientas de reporting.", confidence: 94 },
    { speaker: "Cliente", time: "00:50", seconds: 50, sentiment: { type: "positive", label: "Interesado" }, text: "¿Reporting? Eso suena interesante. ¿Qué tipo de reportes manejan?", confidence: 90 },
    { speaker: "Vendedor", time: "00:58", seconds: 58, sentiment: { type: "normal", label: "Explicación" }, text: "Tenemos dashboards en tiempo real, reportes de conversión por campaña, y análisis de satisfacción del cliente. Todo integrado en una sola plataforma.", confidence: 97 },
    { speaker: "Cliente", time: "01:15", seconds: 75, sentiment: { type: "positive", label: "Interesado" }, text: "Me gustaría ver una demostración. ¿Podemos agendar una cita?", confidence: 93 },
    { speaker: "Vendedor", time: "01:22", seconds: 82, sentiment: { type: "positive", label: "Cierre" }, text: "Por supuesto, agendemos para el próximo jueves a las 10 de la mañana. Le enviaré un enlace de videollamada.", confidence: 98 },
    { speaker: "Cliente", time: "01:30", seconds: 90, sentiment: { type: "normal", label: "Confirmación" }, text: "Perfecto, el jueves a las 10. Le espero.", confidence: 91 },
    { speaker: "Vendedor", time: "01:35", seconds: 95, sentiment: { type: "normal", label: "Despedida" }, text: "Excelente, muchas gracias por su tiempo. Que tenga un excelente día.", confidence: 96 },
  ];

  return {
    call: callData,
    audit: {
      callId: callData.id,
      clientId: callData.clientId,
      fileName: callData.rawTitle,
      trackerId: `tracker_${Date.now()}`,
      score: score,
      agentName: callData.agent,
      date: new Date(callData.date).toLocaleDateString("es-ES"),
      category: callData.category,
      description: "Auditoría de llamada comercial - Evaluación PCE",
      durationSec: 95 + Math.floor(Math.random() * 60),
      rubric: [
        { title: "Saludo y Presentación", points: 8, maxPoints: 10, status: "success", details: ["Saludo cordial", "Se identificó correctamente", "Mencionó la empresa"] },
        { title: "Identificación de Necesidades", points: 7, maxPoints: 10, status: "success", details: ["Preguntó por necesidades actuales", "Escuchó activamente al cliente"] },
        { title: "Manejo de Objeciones", points: 9, maxPoints: 10, status: "success", details: ["Respondió con empatía", "Usó la objeción como oportunidad"] },
        { title: "Presentación de Beneficios", points: 6, maxPoints: 10, status: "warning", details: ["Podría profundizar más en beneficios", "Mencionó características técnicas primero"] },
        { title: "Cierre", points: 8, maxPoints: 10, status: "success", details: ["Solicitó el compromiso", "Confirmó fecha y hora", "Estableció siguientes pasos"] },
      ],
      transcript: transcript,
      summary: "Llamada comercial con buen manejo general. El agente identificó correctamente la necesidad del cliente y logró agendar una demostración. Manejo de objeciones efectivo.",
      clientTemper: "Receptivo",
      commercialOutcome: "Demostración agendada",
      coachingType: "ESTÁNDAR",
      justification: { strengths: "Buen tono y ritmo de conversación", improvements: "Profundizar en beneficios antes de características" },
      purchaseIntentPct: 72,
      purchaseIntentLabel: "Alta intención de compra",
      clientSentimentScoreLabel: "Positivo",
      cognitivePath: "Interés → Duda → Evaluación → Interés renovado → Compromiso",
      transitionSummary: "Transición fluida de objeción a interés con argumentos centrados en el cliente",
      purchaseSignals: ["Preguntó por funcionalidades específicas", "Solicitó demostración", "Confirmó disponibilidad de agenda"],
      objections: ["Contento con proveedor actual", "No veía necesidad de cambio"],
      coaching: {
        strengths: ["Buen manejo de objeciones", "Tono profesional y empático", "Cierre efectivo"],
        improvements: ["Iniciar con preguntas de necesidades", "Reducir pausas durante la presentación"],
        nextSteps: ["Agendar llamada de prueba de la demostración", "Enviar material complementario por correo"],
      },
    },
    transcription: transcript,
    rubric: [
      { title: "Saludo y Presentación", points: 8, maxPoints: 10, status: "success", details: ["Saludo cordial", "Se identificó correctamente", "Mencionó la empresa"] },
      { title: "Identificación de Necesidades", points: 7, maxPoints: 10, status: "success", details: ["Preguntó por necesidades actuales", "Escuchó activamente al cliente"] },
      { title: "Manejo de Objeciones", points: 9, maxPoints: 10, status: "success", details: ["Respondió con empatía", "Usó la objeción como oportunidad"] },
      { title: "Presentación de Beneficios", points: 6, maxPoints: 10, status: "warning", details: ["Podría profundizar más en beneficios", "Mencionó características técnicas primero"] },
      { title: "Cierre", points: 8, maxPoints: 10, status: "success", details: ["Solicitó el compromiso", "Confirmó fecha y hora", "Estableció siguientes pasos"] },
    ],
    coaching: {
      strengths: ["Buen manejo de objeciones", "Tono profesional y empático", "Cierre efectivo"],
      improvements: ["Iniciar con preguntas de necesidades", "Reducir pausas durante la presentación"],
      nextSteps: ["Agendar llamada de prueba de la demostración", "Enviar material complementario por correo"],
    },
    insights: {
      summary: "Llamada comercial con resultado positivo. Se logró agendar una demostración.",
      clientPerception: {
        temper: "Receptivo",
        commercialOutcome: "Demostración agendada",
        purchaseIntentPct: 72,
        purchaseIntentLabel: "Alta intención de compra",
        sentimentLabel: "Positivo",
        cognitivePath: "Interés → Duda → Evaluación → Interés renovado → Compromiso",
        transitionSummary: "Transición fluida de objeción a interés",
      },
      coaching: {
        type: "ESTÁNDAR",
        justification: { strengths: "Buen manejo de objeciones", improvements: "Profundizar en beneficios" },
      },
      purchaseSignals: ["Preguntó por funcionalidades", "Solicitó demostración", "Confirmó disponibilidad"],
      objections: ["Contento con proveedor actual", "No veía necesidad de cambio"],
    },
    annotations: [],
    audioUrl: null,
  };
}

// ── Main Seeder ───────────────────────────────────────────────────

export interface SeededData {
  users: DemoUser[];
  calls: DemoCall[];
  contacts: DemoContact[];
  kpis: ReturnType<typeof generateDemoKPIs>;
  notes: ReturnType<typeof generateDemoNotes>;
}

export function seedAllDemoData(): SeededData {
  return {
    users: DEMO_USERS,
    calls: generateDemoCalls(),
    contacts: generateDemoContacts(),
    kpis: generateDemoKPIs(),
    notes: generateDemoNotes(),
  };
}
