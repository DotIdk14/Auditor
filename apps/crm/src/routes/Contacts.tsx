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
import type { Contact, ContactFilters, ContactStatus, ContactSource } from "@/api/types";
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
} from "lucide-react";

// ─── Status Badge Config ─────────────────────────────────────────────────────

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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
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

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus contactos y leads
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre…"
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
                      <TableHead>Asignado a</TableHead>
                      <TableHead>Última Actividad</TableHead>
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
                          <Badge variant={STATUS_CONFIG[contact.status].variant}>
                            {STATUS_CONFIG[contact.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {SOURCE_LABELS[contact.source] || contact.source}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.assignedToName || contact.assignedTo || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(contact.lastActivityAt)}
                        </TableCell>
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
              }
            : undefined
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
                {Array.from({ length: 9 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {Array.from({ length: 9 }).map((_, colIdx) => (
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
  hasFilters,
  onCreate,
}: {
  hasFilters: boolean;
  onCreate: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <Users className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="font-semibold">
            {hasFilters ? "Sin resultados" : "No hay contactos"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Intenta ajustar los filtros de búsqueda."
              : "Crea tu primer contacto para empezar."}
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
