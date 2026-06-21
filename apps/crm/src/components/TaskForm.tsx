"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/api/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TaskFormData = {
  title: string;
  description: string;
  contactId: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  type: TaskType;
  status: TaskStatus;
};

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: Partial<TaskFormData>;
  contacts?: { id: string; fullName: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "call", label: "Llamada" },
  { value: "email", label: "Correo" },
  { value: "meeting", label: "Reunión" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "demo", label: "Demo" },
  { value: "proposal", label: "Propuesta" },
  { value: "other", label: "Otro" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

const DEFAULT_DATA: TaskFormData = {
  title: "",
  description: "",
  contactId: "",
  assignedTo: "",
  dueDate: "",
  priority: "medium",
  type: "other",
  status: "pending",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  contacts = [],
}: TaskFormProps) {
  const isEditing = !!initialData;

  const [form, setForm] = useState<TaskFormData>(DEFAULT_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setForm({
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        contactId: initialData?.contactId ?? "",
        assignedTo: initialData?.assignedTo ?? "",
        dueDate: initialData?.dueDate ?? "",
        priority: initialData?.priority ?? "medium",
        type: initialData?.type ?? "other",
        status: initialData?.status ?? "pending",
      });
      setErrors({});
    }
  }, [open, initialData]);

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!form.title.trim()) {
      newErrors.title = "El título es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      console.error("TaskForm submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function updateField<K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos de la tarea."
              : "Registra una nueva tarea en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ej: Llamar a Juan para seguimiento"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "task-title-error" : undefined}
            />
            {errors.title && (
              <p id="task-title-error" className="text-sm text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Detalles de la tarea…"
              rows={3}
            />
          </div>

          {/* Contact & Assigned To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-contactId">Contacto</Label>
              <Select
                value={form.contactId}
                onValueChange={(val) => updateField("contactId", val)}
              >
                <SelectTrigger id="task-contactId">
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      Sin contactos disponibles
                    </SelectItem>
                  )}
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignedTo">Asignado a</Label>
              <Input
                id="task-assignedTo"
                value={form.assignedTo}
                onChange={(e) => updateField("assignedTo", e.target.value)}
                placeholder="ID del usuario"
              />
            </div>
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-dueDate">Fecha de vencimiento</Label>
              <Input
                id="task-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioridad</Label>
              <Select
                value={form.priority}
                onValueChange={(val: TaskPriority) => updateField("priority", val)}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(val: TaskType) => updateField("type", val)}
              >
                <SelectTrigger id="task-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="task-status">Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: TaskStatus) => updateField("status", val)}
                >
                  <SelectTrigger id="task-status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Guardando…"
                : isEditing
                  ? "Actualizar Tarea"
                  : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
