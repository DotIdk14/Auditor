"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "@/api/contacts";
import type { Contact, ContactFilters, ContactStatus, ContactSource, ContactDisposition } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import ContactForm, { type ContactFormData } from "@/components/ContactForm";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  PhoneOff,
  PhoneForwarded,
  ClipboardCheck,
  Clock,
} from "lucide-react";

// ─── Disposition Config ─────────────────────────────────────────────────────

type DispositionTab = "no_contactado" | "cuelgue" | "evaluando";

const DISPOSITION_CONFIG: Record<DispositionTab, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  emptyMessage: string;
}> = {
  no_contactado: {
    label: "No Contactados",
    description: "Contactos nuevos, aún no se ha intentado comunicar con ellos",
    icon: <PhoneOff className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    emptyMessage: "No hay contactos sin contactar",
  },
  cuelgue: {
    label: "Cuelgues / Pendientes",
    description: "No se pudo contactar, quedó pendiente de callback",
    icon: <PhoneForwarded className="h-4 w-4" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    emptyMessage: "No hay cuelgues pendientes",
  },
  evaluando: {
    label: "Prospectos Evaluando",
    description: "Ya se les dio información y la están evaluando",
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    emptyMessage: "No hay prospectos en evaluación",
  },
};

const STATUS_CONFIG: Record<ContactStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  lead: { label: "Lead", variant: "secondary" },
  prospect: { label: "Prospecto", variant: "default" },
  customer: { label: "Cliente", variant: "default" },
  churned: { label: "Perdido", variant: "destructive" },
};

const SOURCE_LABELS: Record<ContactSource, string> = {
  inbound: "Entrante",
  outbound: "Saliente",
  referral: "Referido",
  web: "Sitio web",
  event: "Evento",
  manual: "Manual",
  other: "Otro",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Contacts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DispositionTab>("no_contactado");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ContactSource | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);

  // ── Build filters ──────────────────────────────────────────────────────
  const filters: ContactFilters = {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    disposition: activeTab,
    page,
    pageSize,
  };

  // ── Query ──────────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contacts", filters],
    queryFn: () => getContacts(filters),
  });

  // ── Count queries for badges ───────────────────────────────────────────
  const { data: countNoContactado } = useQuery({
    queryKey: ["contacts-count", "no_contactado"],
    queryFn: () => getContacts({ disposition: "no_contactado", pageSize: 1 }),
    select: (d) => d.total,
  });
  const { data: countCuelgue } = useQuery({
    queryKey: ["contacts-count", "cuelgue"],
    queryFn: () => getContacts({ disposition: "cuelgue", pageSize: 1 }),
    select: (d) => d.total,
  });
  const { data: countEvaluando } = useQuery({
    queryKey: ["contacts-count", "evaluando"],
    queryFn: () => getContacts({ disposition: "evaluando", pageSize: 1 }),
    select: (d) => d.total,
  });

  const COUNTS: Record<DispositionTab, number | undefined> = {
    no_contactado: countNoContactado,
    cuelgue: countCuelgue,
    evaluando: countEvaluando,
  };

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: ContactFormData) =>
      createContact({
        fullName: formData.fullName,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        source: formData.source,
        status: formData.status,
        disposition: formData.disposition,
        callbackAt: formData.callbackAt ? new Date(formData.callbackAt).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: ContactFormData }) =>
      updateContact(id, {
        fullName: d.fullName,
        email: d.email || null,
        phone: d.phone || null,
        company: d.company || null,
        source: d.source,
        status: d.status,
        disposition: d.disposition,
        callbackAt: d.callbackAt ? new Date(d.callbackAt).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-count"] });
      setDeleteConfirm(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleFormSubmit(data: ContactFormData) {
    if (editingContact) {
      await updateMutation.mutateAsync({ id: editingContact.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingContact(null);
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact);
    setFormOpen(true);
  }

  function openCreate() {
    setEditingContact(null);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleTabChange(tab: DispositionTab) {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const config = DISPOSITION_CONFIG[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus contactos por etapa del proceso
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contacto
        </Button>
      </div>

      {/* ── Disposition Tabs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.keys(DISPOSITION_CONFIG) as DispositionTab[]).map((tab) => {
          const cfg = DISPOSITION_CONFIG[tab];
          const isActive = tab === activeTab;
          const count = COUNTS[tab];
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all",
                isActive
                  ? cfg.color + " border-current shadow-sm"
                  : "border-muted bg-background hover:bg-muted/50"
              )}
            >
              <div className={cn("shrink-0", isActive ? "text-current" : "text-muted-foreground")}>
                {cfg.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", isActive ? "text-current" : "text-foreground")}>
                    {cfg.label}
                  </span>
                  {count !== undefined && (
                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                      {count}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{cfg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Buscar contactos"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as ContactStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospecto</SelectItem>
            <SelectItem value="customer">Cliente</SelectItem>
            <SelectItem value="churned">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(val) => {
            setSourceFilter(val as ContactSource | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrar por origen">
            <SelectValue placeholder="Todos los orígenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            <SelectItem value="inbound">Entrante</SelectItem>
            <SelectItem value="outbound">Saliente</SelectItem>
            <SelectItem value="referral">Referido</SelectItem>
            <SelectItem value="web">Sitio web</SelectItem>
            <SelectItem value="event">Evento</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <ContactsTableSkeleton />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Error al cargar contactos"}
          onRetry={() => refetch()}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          tab={activeTab}
          hasFilters={!!search || statusFilter !== "all" || sourceFilter !== "all"}
          onCreate={openCreate}
        />
      ) : (
        <>
          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Origen</TableHead>
                      {activeTab === "cuelgue" && (
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Callback
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="w-[70px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <TableCell className="font-medium">
                          {contact.fullName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.email || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.phone || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.company || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[contact.status]?.variant ?? "outline"}>
                            {STATUS_CONFIG[contact.status]?.label ?? contact.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {SOURCE_LABELS[contact.source] || contact.source}
                        </TableCell>
                        {activeTab === "cuelgue" && (
                          <TableCell>
                            {contact.callbackAt ? (
                              <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                                <Clock className="h-3 w-3" />
                                {formatDate(contact.callbackAt)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(contact);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(contact);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} de{" "}
                {data.total} contactos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Siguiente
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingContact
            ? {
                fullName: editingContact.fullName,
                email: editingContact.email ?? "",
                phone: editingContact.phone ?? "",
                company: editingContact.company ?? "",
                source: editingContact.source,
                status: editingContact.status,
                disposition: editingContact.disposition ?? "no_contactado",
                callbackAt: editingContact.callbackAt ?? "",
              }
            : { disposition: activeTab }
        }
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Contacto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar a{" "}
              <span className="font-medium text-foreground">{deleteConfirm?.fullName}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ContactsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {Array.from({ length: 7 }).map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full" style={{ maxWidth: colIdx === 0 ? 140 : 100 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-destructive">Error al cargar contactos</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  tab,
  hasFilters,
  onCreate,
}: {
  tab: DispositionTab;
  hasFilters: boolean;
  onCreate: () => void;
}) {
  const config = DISPOSITION_CONFIG[tab];
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className={cn("rounded-full p-3", config.color)}>
          {config.icon}
        </div>
        <div className="text-center">
          <h3 className="font-semibold">
            {hasFilters ? "Sin resultados" : config.emptyMessage}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Intenta ajustar los filtros de búsqueda."
              : "Crea un nuevo contacto para empezar."}
          </p>
        </div>
        {!hasFilters && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
