"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContact, getContactCalls, updateContact } from "@/api/contacts";
import { getTasks } from "@/api/tasks";
import type { Contact, Task } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ContactForm, { type ContactFormData } from "@/components/ContactForm";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Building2,
  Tag,
  Globe,
  User,
  Activity,
  PhoneCall,
  FileText,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight,
  PhoneOff,
  PhoneForwarded,
  ClipboardCheck,
} from "lucide-react";

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lead: { label: "Lead", variant: "secondary" },
  prospect: { label: "Prospecto", variant: "default" },
  customer: { label: "Cliente", variant: "default" },
  churned: { label: "Perdido", variant: "destructive" },
};

const DISPOSITION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  no_contactado: { label: "No contactado", icon: <PhoneOff className="h-4 w-4" />, color: "text-blue-600" },
  cuelgue: { label: "Cuelgue / Pendiente", icon: <PhoneForwarded className="h-4 w-4" />, color: "text-amber-600" },
  evaluando: { label: "Evaluando", icon: <ClipboardCheck className="h-4 w-4" />, color: "text-emerald-600" },
};

const SOURCE_LABELS: Record<string, string> = {
  inbound: "Entrante",
  outbound: "Saliente",
  referral: "Referido",
  web: "Sitio web",
  event: "Evento",
  manual: "Manual",
  other: "Otro",
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Baja", variant: "secondary" },
  medium: { label: "Media", variant: "default" },
  high: { label: "Alta", variant: "destructive" },
  urgent: { label: "Urgente", variant: "destructive" },
};

const TASK_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En progreso", variant: "default" },
  completed: { label: "Completada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────
  const {
    data: contact,
    isLoading: contactLoading,
    isError: contactError,
    error: contactErr,
    refetch: refetchContact,
  } = useQuery<Contact>({
    queryKey: ["contact", id],
    queryFn: () => getContact(id!),
    enabled: !!id,
  });

  const {
    data: tasks,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ["contact-tasks", id],
    queryFn: () => getTasks({ contactId: id, pageSize: 50 }),
    enabled: !!id,
  });

  const {
    data: calls,
    isLoading: callsLoading,
  } = useQuery({
    queryKey: ["contact-calls", id],
    queryFn: () => getContactCalls(id!),
    enabled: !!id,
  });

  // ── Mutation ───────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      updateContact(id!, {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source,
        status: data.status,
        disposition: data.disposition,
        callbackAt: data.callbackAt ? new Date(data.callbackAt).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormOpen(false);
    },
  });

  // ── Loading ────────────────────────────────────────────────────────────
  if (contactLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" style={{ maxWidth: `${300 + i * 40}px` }} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (contactError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a contactos
        </Button>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold text-destructive">Error al cargar contacto</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {contactErr instanceof Error ? contactErr.message : "No se pudo cargar el contacto"}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetchContact()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!contact) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a contactos
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Contacto no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{contact.fullName}</h1>
          <Badge variant={STATUS_CONFIG[contact.status]?.variant ?? "outline"}>
            {STATUS_CONFIG[contact.status]?.label ?? contact.status}
          </Badge>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="calls">Llamadas</TabsTrigger>
        </TabsList>

        {/* ── Info Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Datos del Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email || "—"} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Teléfono" value={contact.phone || "—"} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Empresa" value={contact.company || "—"} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Origen" value={SOURCE_LABELS[contact.source] || contact.source} />
                <InfoRow icon={<Tag className="h-4 w-4" />} label="Estado" value={STATUS_CONFIG[contact.status]?.label ?? contact.status} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    {DISPOSITION_CONFIG[contact.disposition]?.icon ?? <Tag className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Disposición</p>
                    <p className={cn("text-sm font-medium", DISPOSITION_CONFIG[contact.disposition]?.color ?? "")}>
                      {DISPOSITION_CONFIG[contact.disposition]?.label ?? contact.disposition}
                    </p>
                  </div>
                </div>
                {contact.disposition === "cuelgue" && contact.callbackAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Fecha de callback</p>
                      <p className="text-sm font-medium text-amber-600">
                        {formatDate(contact.callbackAt)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Asignación y Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Asignado a"
                  value={contact.assignedToName || contact.assignedTo || "—"}
                />
                <InfoRow
                  icon={<ChevronRight className="h-4 w-4" />}
                  label="Etapa en Pipeline"
                  value={contact.stageName || contact.stageId || "Sin etapa"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Creado"
                  value={formatDate(contact.createdAt)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Última actividad"
                  value={formatDate(contact.lastActivityAt)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Activity Tab ──────────────────────────────────────────────── */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Tareas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !tasks || tasks.data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No hay tareas registradas para este contacto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.data.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={PRIORITY_CONFIG[task.priority]?.variant ?? "outline"} className="text-xs">
                            {PRIORITY_CONFIG[task.priority]?.label ?? task.priority}
                          </Badge>
                          <Badge variant={TASK_STATUS_CONFIG[task.status]?.variant ?? "outline"} className="text-xs">
                            {TASK_STATUS_CONFIG[task.status]?.label ?? task.status}
                          </Badge>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Calls Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="calls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="h-4 w-4 text-primary" />
                Historial de Llamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !calls || calls.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <PhoneCall className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No hay llamadas registradas para este contacto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.map((call: any, idx: number) => (
                    <div key={call.id ?? idx} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {call.date ? formatDate(call.date) : "Sin fecha"}
                          </span>
                        </div>
                        {call.duration != null && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                        )}
                      </div>
                      {call.result && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Resultado:</span> {call.result}
                        </p>
                      )}
                      {call.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Notas:</span> {call.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
        }}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
        initialData={{
          fullName: contact.fullName,
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          company: contact.company ?? "",
          source: contact.source,
          status: contact.status,
          disposition: contact.disposition ?? "no_contactado",
          callbackAt: contact.callbackAt ?? "",
        }}
      />
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
