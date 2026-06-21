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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactCreate, ContactUpdate, ContactSource, ContactStatus } from "@/api/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContactFormData = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  source: ContactSource;
  status: ContactStatus;
};

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SOURCE_OPTIONS: { value: ContactSource; label: string }[] = [
  { value: "inbound", label: "Entrante" },
  { value: "outbound", label: "Saliente" },
  { value: "referral", label: "Referido" },
  { value: "web", label: "Sitio web" },
  { value: "event", label: "Evento" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Otro" },
];

const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospecto" },
  { value: "customer", label: "Cliente" },
  { value: "churned", label: "Perdido" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContactForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: ContactFormProps) {
  const isEditing = !!initialData;

  const [form, setForm] = useState<ContactFormData>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    source: "manual",
    status: "lead",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setForm({
        fullName: initialData?.fullName ?? "",
        email: initialData?.email ?? "",
        phone: initialData?.phone ?? "",
        company: initialData?.company ?? "",
        source: initialData?.source ?? "manual",
        status: initialData?.status ?? "lead",
      });
      setErrors({});
    }
  }, [open, initialData]);

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "El nombre es obligatorio";
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
      // Error handling is delegated to the parent
      console.error("ContactForm submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function updateField<K extends keyof ContactFormData>(
    key: K,
    value: ContactFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos del contacto."
              : "Registra un nuevo contacto en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="contact-fullName">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-fullName"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Ej: Juan Pérez"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "contact-fullName-error" : undefined}
            />
            {errors.fullName && (
              <p id="contact-fullName-error" className="text-sm text-destructive">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="contact-email">Correo electrónico</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Ej: juan@ejemplo.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Teléfono</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Ej: 55 1234 5678"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="contact-company">Empresa</Label>
            <Input
              id="contact-company"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              placeholder="Ej: Empresa S.A. de C.V."
            />
          </div>

          {/* Source & Status – side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-source">Origen</Label>
              <Select
                value={form.source}
                onValueChange={(val: ContactSource) => updateField("source", val)}
              >
                <SelectTrigger id="contact-source">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-status">Estado</Label>
              <Select
                value={form.status}
                onValueChange={(val: ContactStatus) => updateField("status", val)}
              >
                <SelectTrigger id="contact-status">
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
                  ? "Actualizar Contacto"
                  : "Crear Contacto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
