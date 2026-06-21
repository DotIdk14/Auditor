"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask } from "@/api/tasks";
import { getContacts } from "@/api/contacts";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/api/types";
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
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import TaskForm, { type TaskFormData } from "@/components/TaskForm";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Users,
  Calendar,
  Clock,
  FileText,
  Presentation,
  MessageSquare,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Baja", variant: "secondary" },
  medium: { label: "Media", variant: "default" },
  high: { label: "Alta", variant: "destructive" },
  urgent: { label: "Urgente", variant: "destructive" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En progreso", variant: "default" },
  completed: { label: "Completada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

const TYPE_ICONS: Record<TaskType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  follow_up: MessageSquare,
  demo: Presentation,
  proposal: FileText,
  other: CheckSquare,
};

const TYPE_LABELS: Record<TaskType, string> = {
  call: "Llamada",
  email: "Correo",
  meeting: "Reunión",
  follow_up: "Seguimiento",
  demo: "Demo",
  proposal: "Propuesta",
  other: "Otro",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Tasks() {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", statusFilter, priorityFilter, search],
    queryFn: () =>
      getTasks({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        pageSize: 100,
      }),
  });

  // Fetch contacts for the task form dropdown
  const { data: contactsData } = useQuery({
    queryKey: ["contacts-mini"],
    queryFn: () => getContacts({ pageSize: 200 }),
  });

  const contacts = contactsData?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: TaskFormData) =>
      createTask({
        title: formData.title,
        description: formData.description || undefined,
        contactId: formData.contactId || "",
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        type: formData.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: TaskFormData }) =>
      updateTask(id, {
        title: d.title,
        description: d.description || null,
        assignedTo: d.assignedTo,
        dueDate: d.dueDate || null,
        priority: d.priority,
        type: d.type,
        status: d.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteConfirm(null);
    },
  });

  // Mark as complete shortcut
  const completeMutation = useMutation({
    mutationFn: (task: Task) =>
      updateTask(task.id, {
        status: task.status === "completed" ? "pending" : "completed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleFormSubmit(data: TaskFormData) {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingTask(null);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function openCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  // ── Filter tasks client-side by search ─────────────────────────────────
  const tasks = data?.data ?? [];
  const filteredTasks = search
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.contactName?.toLowerCase().includes(search.toLowerCase()),
      )
    : tasks;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus tareas y actividades pendientes
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar tareas"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as TaskStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(val) => setPriorityFilter(val as TaskPriority | "all")}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrar por prioridad">
            <SelectValue placeholder="Todas las prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TasksSkeleton />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Error al cargar tareas"}
          onRetry={() => refetch()}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          hasFilters={!!search || statusFilter !== "all" || priorityFilter !== "all"}
          onCreate={openCreate}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => {
            const TypeIcon = TYPE_ICONS[task.type] || CheckSquare;
            return (
              <Card
                key={task.id}
                className={cn(
                  "transition-shadow hover:shadow-md",
                  task.status === "completed" && "opacity-70",
                )}
              >
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <TypeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium leading-tight",
                            task.status === "completed" && "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1" aria-label="Acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => completeMutation.mutate(task)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {task.status === "completed" ? "Reabrir" : "Marcar completada"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(task)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(task)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Tags row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={PRIORITY_CONFIG[task.priority]?.variant ?? "outline"} className="text-[10px] px-1.5 py-0">
                      {PRIORITY_CONFIG[task.priority]?.label ?? task.priority}
                    </Badge>
                    <Badge variant={STATUS_CONFIG[task.status]?.variant ?? "outline"} className="text-[10px] px-1.5 py-0">
                      {STATUS_CONFIG[task.status]?.label ?? task.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {TYPE_LABELS[task.type] || task.type}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {task.contactName && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{task.contactName}</span>
                      </div>
                    )}
                    {task.assignedToName && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{task.assignedToName}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Vence: {formatDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TaskForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description ?? "",
                contactId: editingTask.contactId || "",
                assignedTo: editingTask.assignedTo,
                dueDate: editingTask.dueDate ?? "",
                priority: editingTask.priority,
                type: editingTask.type,
                status: editingTask.status,
              }
            : undefined
        }
        contacts={contacts.map((c) => ({ id: c.id, fullName: c.fullName }))}
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
            <DialogTitle>Eliminar Tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la tarea{" "}
              <span className="font-medium text-foreground">"{deleteConfirm?.title}"</span>?
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

function TasksSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-destructive">Error al cargar tareas</h3>
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
        <CheckSquare className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="font-semibold">
            {hasFilters ? "Sin resultados" : "No hay tareas"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Intenta ajustar los filtros de búsqueda."
              : "Crea tu primera tarea para empezar."}
          </p>
        </div>
        {!hasFilters && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
